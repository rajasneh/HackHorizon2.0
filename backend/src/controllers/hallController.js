import { and, eq, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { halls } from "../drizzle/hallSchema.js";
import { seats } from "../drizzle/seatSchema.js";
import { screenTable } from "../drizzle/screenSchema.js";
import { organiser } from "../drizzle/organiserSchema.js";
import { admins } from "../drizzle/adminSchema.js";
import { tickets } from "../drizzle/ticketSchema.js";
import { v4 as uuidv4 } from 'uuid';
import { ticketPrices } from "../drizzle/ticketPrices.js";
import { ticketCategories } from "../drizzle/ticketPrices.js";


export const registerHall = async (req, res, next) => { 
    try {

        const { name, location, city, state, pincode, area_name, totalScreens, createdById } = req.body;

        // Check if hall alreday exists : 
        const doesExist = await db
            .select()
            .from(halls)
            .where(
                and(eq(halls.name, name), eq(halls.city, city))
            )

        if (doesExist.length > 0) {
            return res.status(400).json({
                success: false,
                message: "This hall already exists in the selected city and area. Please check before registering again."
            })
        }

        const long = location.lng;
        const lati = location.lat;

        // Verify the ID in organiser and admin 
        const [isOrg, isAdm] = await Promise.all([      // Perform both checks in parallel
            db.select().from(organiser).where(organiser.id, createdById),
            db.select().from(admins).where(admins.id, createdById)
        ]);

        if (isOrg.length === 0 && isAdm.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Created by ID does not match any entity's ID"
            });
        }

        const created_by_id = isOrg.length > 0 ? isOrg[0].id : isAdm[0].id;
        const created_by_type = isOrg.length > 0 ? isOrg[0].role : isAdm[0].role;

        let isVerified = false;
        let verificationStatus = "pending";
        if(created_by_type === "moderator") {
            isVerified = true;
            verificationStatus = "approved";
        }

        // Generate hall id
        const newHallId = uuidv4();

        await db.insert(halls).values({
            id: newHallId,
            name: name,
            area_name,
            longitude: long,
            latitude: lati,
            city: city,
            state: state,
            pincode: pincode,
            totalScreens: [],
            numberOfScreens: totalScreens,
            createdById: created_by_id,
            createdByType: created_by_type,
            isVerified,
            verificationStatus
        })

        const newHall = await db.select().from(halls)
            .where(eq(halls.id, newHallId));

        const payload = { 
            hallID: newHall[0].id,
            totalScreen: newHall[0].numberOfScreens || 0
        }

        req.hall = payload;
        next();

    } catch (err) {
        console.log("Error in register hall : ", err);
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


export const createSeatLayout = async (req, res) => {
    try {

        const { hallID, screenID, cols, zones } = req.body;

        // Validate hall
        const checkHallExist = await db.select().from(halls).where(eq(halls.id, hallID));
        if (checkHallExist.length === 0) {
            return res.status(404).json({ success: false, message: "Hall provided does not exist" });
        }

        // Validate screen
        const checkScreenID = await db.select().from(screenTable)
            .where(and(eq(screenTable.id, screenID), eq(screenTable.hallId, hallID)));

        if (checkScreenID.length === 0) {
            return res.status(404).json({ success: false, message: "Screen provided does not exist" });
        }

        let totalSeats = 0;
        let seatInserts = [];

        // Process each zone dynamically
        zones.forEach(zone => {
            const { name, start, end, gaps = [] } = zone;
            
            // Convert gaps string to array if needed
            const gapCols = typeof gaps === 'string' ? gaps.split(',').map(Number).filter(n => !isNaN(n)) : gaps;
            
            // Generate seats for this zone's row range
            for (let rowCode = start.charCodeAt(0); rowCode <= end.charCodeAt(0); rowCode++) {
                const row = String.fromCharCode(rowCode);
                const numCols = cols[row] || 10; // Default to 10 if not specified
                
                for (let col = 1; col <= numCols; col++) {
                    // Create actual seat
                    seatInserts.push({
                        hallId: hallID,
                        screenId: screenID,
                        seat_label: row + col,
                        row: row,
                        col: col,
                        seatType: name,
                        isGap: false
                    });
                    totalSeats++;
                    
                    // Create gap after this column if needed
                    if (gapCols.includes(col)) {
                        seatInserts.push({
                            hallId: hallID,
                            screenId: screenID,
                            seat_label: `${row}${col}.5-gap`,
                            row: row,
                            col: col + 0.5,
                            seatType: name,
                            isGap: true
                        });
                    }
                }
            }
        });

        // Calculate seat type counts
        const seatTypeCounts = {};
        seatInserts.forEach(seat => {
            if (!seat.isGap) {
                seatTypeCounts[seat.seatType] = (seatTypeCounts[seat.seatType] || 0) + 1;
            }
        });

        // Insert all seats in one go
        if (seatInserts.length > 0) {
            await db.insert(seats).values(seatInserts);
        }

        // Update both totalSeats, isSeatAlloted, and seatTypeCounts in a single operation
        await db
            .update(screenTable)
            .set({ totalSeats: totalSeats, isSeatAlloted: true, seatTypeCounts })
            .where(eq(screenTable.id, screenID));

        return res.status(200).json({
            success: true,
            message: "Seats created successfully!"
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}


export const createScreen = async (req, res, next) => {
    try {

        const { hallID, totalScreen } = req.hall;

        const isExist = await db.select().from(halls).where(eq(halls.id, hallID));
        if (!hallID || isExist.length <= 0) {
            return res.status(404).json({
                success: false,
                message: "Hall ID not found"
            })
        }

        // Screen objects created
        for (let i = 1; i <= totalScreen; i++) {
            const screenId = uuidv4();
            await db.insert(screenTable).values({
                id: screenId,
                hallId: hallID,
                screen_no: i,
                isEmpty: true,
                isSeatAlloted: false,
                totalSeats: 0
            });

            // Add screen ID to hall's totalScreens array
            const currentHall = await db.select().from(halls).where(eq(halls.id, hallID));
            const currentScreens = currentHall[0].totalScreens || [];
            currentScreens.push(screenId);
            
            await db.update(halls)
                .set({ totalScreens: currentScreens })
                .where(eq(halls.id, hallID));
        }

        return res.status(201).json({
            success: true,
            message: "Screens created successfully!"
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


export const getHalls = async(req, res) => {
    try{
        console.log("getHalls function called");
        
        const hallData = await db.select().from(halls)
        console.log("Hall data fetched:", hallData);

        return res.status(200).json({
            success: true,
            message: "Halls fetched successfully",
            result: hallData
        })
            
    } catch(err) {
        console.error("Error in getHalls:", err);
        console.error("Error stack:", err.stack);
        return res.status(500).json({
            success: false,
            message: `Error in getHalls : ${err.message}`
        })
    }
}

export const getHallById = async(req, res) => {
    try{

        const { id } = req.params;
        // Search the id in halls table
        const hallData = await db.select()
            .from(halls)
            .where(eq(halls.id, id));

        if(!hallData) {
            return res.status(400).json({
                success: false,
                message: "Hall Id doesn't exist"
            })
        }

        const screenData = await db.select()
            .from(screenTable)
            .where(eq(screenTable.hallId, hallData[0].id));

        return res.status(200).json({
            hallData,
            screenData
        })

    } catch(err) {
        return res.status(500).json({
            success: false,
            message: `Error in getHallById : ${err.message}`
        })
    }
}


export const editHall = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, location, city, state, pincode, area_name, totalScreens } = req.body;

        // Check if hall exists
        const hallExists = await db.select().from(halls).where(eq(halls.id, id));
        if (hallExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Hall not found"
            });
        }

        // Prepare update data
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (area_name !== undefined) updateData.area_name = area_name;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (pincode !== undefined) updateData.pincode = pincode;
        if (location !== undefined) {
            updateData.longitude = location.lng;
            updateData.latitude = location.lat;
        }
        if (totalScreens !== undefined) updateData.totalScreens = totalScreens; // Now expects an array

        // Update the hall
        await db.update(halls).set(updateData).where(eq(halls.id, id));

        // Fetch updated hall data
        const updatedHall = await db.select().from(halls).where(eq(halls.id, id));

        return res.status(200).json({
            success: true,
            message: "Hall updated successfully",
            data: updatedHall[0]
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}


export const deleteHall = async(req, res) => {
    try{

        const { id } = req.params;

        const deleteHall = await db.delete(halls).where(eq(halls.id, id));

        return res.status(200).json({
            success: true,
            message: "Hall deleted successfully"
        })

    } catch(err) {
        return res.status(500).json({
            success: false,
            message: `Error in deleteHall : ${err.message}`
        })
    }
}

export const getSeatsAndPriceByScreenID = async (req, res) => {
    try {
        const { screenID, eventId } = req.params;
        // Fetch seats for the screen
        const seatList = await db.select().from(seats).where(eq(seats.screenId, screenID));
        
        // Get event-specific booked seats
        const confirmedTickets = await db.select({ seatNumbers: tickets.seatNumbers })
            .from(tickets)
            .where(and(eq(tickets.eventId, eventId), eq(tickets.status, 'CONFIRMED')));
        
        const bookedSeatIds = confirmedTickets
            .filter(ticket => ticket.seatNumbers)
            .flatMap(ticket => ticket.seatNumbers);
        
        // Mark seats as booked based on event-specific bookings
        const seatsWithBookingStatus = seatList.map(seat => ({
            ...seat,
            isBooked: bookedSeatIds.includes(seat.id)
        }));
        
        // Fetch price details for the event
        let priceDetails = null;
        const ticketPriceData = await db.select().from(ticketPrices).where(eq(ticketPrices.eventId, eventId)); 
        if (ticketPriceData && ticketPriceData.length > 0) {
            priceDetails = ticketPriceData[0]; 
        } else {
            const ticketCategoryData = await db.select().from(ticketCategories).where(eq(ticketCategories.eventId, eventId));
            if (ticketCategoryData && ticketCategoryData.length > 0) {
                priceDetails = ticketCategoryData;
            }
        }
        return res.status(200).json({ success: true, seats: seatsWithBookingStatus, price: priceDetails });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

export const editSeatLayout = async (req, res) => {
  try {
    const { screenId } = req.params;
    const { seats: newSeats, totalSeats } = req.body;

    // Delete old seats for this screen
    await db.delete(seats).where(eq(seats.screenId, screenId));

    // Insert new seats
    if (Array.isArray(newSeats) && newSeats.length > 0) {
      await db.insert(seats).values(newSeats);
    }

    // Update totalSeats in screenTable
    await db.update(screenTable)
      .set({ totalSeats, isSeatAlloted: true })
      .where(eq(screenTable.id, screenId));

    res.json({ success: true, message: "Seat layout updated!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Add a new screen to a hall (separate controller for ViewHall add screen)
export const addScreenToHall = async (req, res) => {
  try {
    const { hallId } = req.body;
    if (!hallId) {
      return res.status(400).json({ success: false, message: "hallId is required" });
    }
    // Check if hall exists
    const hall = await db.select().from(halls).where(eq(halls.id, hallId));
    if (!hall.length) {
      return res.status(404).json({ success: false, message: "Hall not found" });
    }
    
    // Create new screen
    const newScreenId = uuidv4();
    const currentScreens = hall[0].totalScreens || [];
    const newScreenNo = currentScreens.length + 1;
    
    await db.insert(screenTable).values({
      id: newScreenId,
      hallId,
      screen_no: newScreenNo,
      isEmpty: true,
      isSeatAlloted: false,
      totalSeats: 0
    });
    
    // Add screen ID to hall's totalScreens array
    currentScreens.push(newScreenId);
    await db.update(halls).set({ totalScreens: currentScreens }).where(eq(halls.id, hallId));
    
    const newScreen = await db.select().from(screenTable).where(eq(screenTable.id, newScreenId));
    return res.status(201).json({ success: true, message: "Screen added successfully", screen: newScreen[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Delete a screen and all its seats
export const deleteScreen = async (req, res) => {
  try {
    const { screenId } = req.params;
    if (!screenId) {
      return res.status(400).json({ success: false, message: "screenId is required" });
    }
    // Check if screen exists
    const screen = await db.select().from(screenTable).where(eq(screenTable.id, screenId));
    if (!screen.length) {
      return res.status(404).json({ success: false, message: "Screen not found" });
    }
    const hallId = screen[0].hallId;
    // if screen is booked, then do not delete the screen
    if(screen[0].status === 'booked') { 
      return res.status(400).json({ success: false, message: "Screen is booked, cannot delete" });
    }
    // Update the screen status to inactive
    await db.update(screenTable).set({ status: "inactive" }).where(eq(screenTable.id, screenId));

    // Delete all seats for this screen
    await db.delete(seats).where(eq(seats.screenId, screenId));
    // Delete the screen
    await db.delete(screenTable).where(eq(screenTable.id, screenId));
    // Remove screen ID from totalScreens array in the hall
    const hall = await db.select().from(halls).where(eq(halls.id, hallId));
    if (hall.length) {
      const currentScreens = hall[0].totalScreens || [];
      const updatedScreens = currentScreens.filter(id => id !== screenId);
      await db.update(halls).set({ totalScreens: updatedScreens }).where(eq(halls.id, hallId));
    }
    return res.status(200).json({ success: true, message: "Screen and its seats deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateHallStatus = async(req, res) => {
    try{
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!['active', 'inactive', 'booked'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Status must be 'active', 'inactive', or 'booked'"
            });
        }

        // Check if hall exists
        const hallData = await db.select().from(halls).where(eq(halls.id, id));

        if(hallData.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Hall not found"
            });
        }

        // Check if hall is booked and trying to change status
        if(hallData[0].status === 'booked' && status !== 'booked') {
            return res.status(400).json({
                success: false,
                message: "Cannot change status of a booked hall"
            });
        }

        // Update the hall status
        await db.update(halls)
            .set({ status })
            .where(eq(halls.id, id));

        // Fetch updated hall data
        const updatedHall = await db.select().from(halls).where(eq(halls.id, id));

        return res.status(200).json({
            success: true,
            message: "Hall status updated successfully",
            data: updatedHall[0]
        });

    } catch(err) {
        console.error("Error in updateHallStatus:", err);
        return res.status(500).json({
            success: false,
            message: `Error in updateHallStatus: ${err.message}`
        });
    }
}

export const updateScreenStatus = async(req, res) => {
    try{
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!['active', 'inactive', 'booked'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Status must be 'active', 'inactive', or 'booked'"
            });
        }

        // Check if screen exists
        const screenData = await db.select().from(screenTable).where(eq(screenTable.id, id));

        if(screenData.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Screen not found"
            });
        }

        // Check if screen is booked and trying to change status
        if(screenData[0].status === 'booked' && status !== 'booked') {
            return res.status(400).json({
                success: false,
                message: "Cannot change status of a booked screen"
            });
        }

        // Update the screen status
        await db.update(screenTable)
            .set({ status })
            .where(eq(screenTable.id, id));

        // Fetch updated screen data
        const updatedScreen = await db.select().from(screenTable).where(eq(screenTable.id, id));

        return res.status(200).json({
            success: true,
            message: "Screen status updated successfully",
            data: updatedScreen[0]
        });

    } catch(err) {
        console.error("Error in updateScreenStatus:", err);
        return res.status(500).json({
            success: false,
            message: `Error in updateScreenStatus: ${err.message}`
        });
    }
}

// Get unique seat types for a particular screen
export const getSeatTypesByScreenID = async (req, res) => {
  try {
    const { screenID } = req.params;
    if (!screenID) {
      return res.status(400).json({ success: false, message: "screenID is required" });
    }
    // Get all seats for this screen
    const seatRows = await db.select().from(seats).where(eq(seats.screenId, screenID));
    // Extract unique seat types and their counts
    const seatTypeCounts = {};
    seatRows.forEach(seat => {
      if (!seat.isGap) {
        seatTypeCounts[seat.seatType] = (seatTypeCounts[seat.seatType] || 0) + 1;
      }
    });
    const seatTypes = Object.entries(seatTypeCounts).map(([type, count]) => ({ type, count }));
    return res.status(200).json({ success: true, seatTypes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};



// TEMPORARY: Update seatTypeCounts for all screens
export const updateAllScreenSeatTypeCounts = async (req, res) => {
  try {
    const allScreens = await db.select().from(screenTable);
    let updated = 0;
    for (const screen of allScreens) {
      const seatRows = await db.select().from(seats).where(eq(seats.screenId, screen.id));
      const seatTypeCounts = {};
      seatRows.forEach(seat => {
        if (!seat.isGap) {
          seatTypeCounts[seat.seatType] = (seatTypeCounts[seat.seatType] || 0) + 1;
        }
      });
      await db.update(screenTable).set({ seatTypeCounts }).where(eq(screenTable.id, screen.id));
      updated++;
    }
    res.status(200).json({ success: true, message: `Updated seatTypeCounts for ${updated} screens.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
