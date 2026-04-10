import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const FieldSchema = new Schema({
  label: { type: String },
  type: { type: String },
  required: { type: Boolean },
  options: [{ type: String }] // Only for dropdown/checkbox
});

const FormSchema = new Schema({
  eventID: { type: String },
  fields: [FieldSchema],
  teamRegistration: { type: Boolean },
  createdAt: { type: Date, default: Date.now }
});

const Form = model('Form', FormSchema);

export default Form;
