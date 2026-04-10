import Counter from "../models/Counter.js";

export const getNextSequence = async (name) => {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return counter.seq;
};

export const formatId = ({ prefix, seq, pad, separator = "" }) => {
  const padded = String(seq).padStart(pad, "0");
  return `${prefix}${separator}${padded}`;
};

export const getNextFormattedId = async ({ name, prefix, pad, separator = "" }) => {
  const seq = await getNextSequence(name);
  return formatId({ prefix, seq, pad, separator });
};
