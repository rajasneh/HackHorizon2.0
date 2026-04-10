import { FiArrowRight, FiPlay } from "react-icons/fi";

export const Banner = ({ img }) => {
    return (
        <div className="w-full px-4 md:px-8 flex justify-center items-center ">
            <div className="overflow-hidden rounded-2xl shadow-2xl w-full ">
                <img
                    src={img}
                    alt="Banner"
                    className="w-full h-28 md:h-40 object-contain object-center bg-white"
                />
            </div>
        </div>
    );
}