import mongoose, { Schema, Types } from "mongoose";

import {
    OrderInterface,
    StockInfoInterface,
    SubOrderInterface,
} from "@app-types/models/order";
import dbConnect from "@lib/mongoose";
import './user'

const topUpSchema = new Schema<{
    amount: number,
    status: 'pending' | 'paid',
    user: any,
    uniqid: string,
    notes?: string,
    metadata: { type: Schema.Types.Mixed },
    paid_at?: Date
}>({
    amount: {type: Number, required: true},
    uniqid: {type: String, required: false},
    // @ts-ignore
    sellix: { type: Schema.Types.Mixed },
    notes: {type: String, required: false},
    status: {
        type: String,
        enum : ['pending','paid'],
        default: 'pending'
    },
      user:  {
      type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
    },
    paid_at: {type: Date, required: false}
}, {
    timestamps: true
});
// @ts-ignore
let cached = global.topuporderModel;
if (!cached) {
    // @ts-ignore
    // eslint-disable-next-line no-multi-assign
    cached = global.topuporderModel = { model: null, promise: null };
}
export default async function getTopUpOrderModel() {
    if (cached.model) return cached.model;

    if (!cached.promise) {
        const mongoose = await dbConnect();
        cached.promise = mongoose.model("TopUpOrder", topUpSchema);
    }
    cached.model = await cached.promise;
    return cached.model;
}

