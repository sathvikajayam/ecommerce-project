import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Brand from "../models/brandModel.js";
import Counter from "../models/Counter.js";
import { formatId, getNextSequence } from "../utils/idGenerator.js";

dotenv.config();

const getMaxSeqFromIds = (ids, pattern) => {
  let maxSeq = 0;
  ids.forEach((value) => {
    if (typeof value !== "string") return;
    const match = value.match(pattern);
    if (!match) return;
    const seq = Number(match[1]);
    if (Number.isFinite(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  });
  return maxSeq;
};

const ensureCounterAtLeast = async (name, minSeq) => {
  await Counter.findOneAndUpdate(
    { name },
    { $max: { seq: minSeq } },
    { upsert: true }
  );
};

const backfillCollection = async ({
  model,
  field,
  counterName,
  prefix,
  pad,
  separator = "",
  pattern,
}) => {
  const existingDocs = await model.find({ [field]: { $type: "string" } }, { [field]: 1 }).lean();
  const existingIds = existingDocs.map((doc) => doc[field]);
  const maxSeq = getMaxSeqFromIds(existingIds, pattern);
  await ensureCounterAtLeast(counterName, maxSeq);

  const missingDocs = await model.find({
    $or: [
      { [field]: { $exists: false } },
      { [field]: null },
      { [field]: "" },
    ],
  }).sort({ createdAt: 1, _id: 1 });

  for (const doc of missingDocs) {
    const seq = await getNextSequence(counterName);
    const nextId = formatId({ prefix, seq, pad, separator });
    await model.updateOne({ _id: doc._id }, { $set: { [field]: nextId } });
    console.log(`Updated ${model.modelName} ${doc._id} -> ${nextId}`);
  }
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    await backfillCollection({
      model: Product,
      field: "productId",
      counterName: "product",
      prefix: "PRD",
      pad: 4,
      separator: "-",
      pattern: /^PRD-(\d+)$/,
    });

    await backfillCollection({
      model: Category,
      field: "categoryId",
      counterName: "category",
      prefix: "CAT",
      pad: 4,
      separator: "-",
      pattern: /^CAT-(\d+)$/,
    });

    await backfillCollection({
      model: Brand,
      field: "brandId",
      counterName: "brand",
      prefix: "BRD",
      pad: 4,
      separator: "-",
      pattern: /^BRD-(\d+)$/,
    });

    console.log("Backfill complete");
    process.exit(0);
  } catch (err) {
    console.error("Backfill failed:", err);
    process.exit(1);
  }
};

run();
