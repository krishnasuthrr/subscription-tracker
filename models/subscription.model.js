import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subscription name is required"],
      trim: true,
      minLength: 5,
      maxLength: 100,
    },
    price: {
      type: Number,
      required: [true, "Subscription price is required"],
      min: [0, "Price must be greater than 0"],
    },
    currency: {
      type: String,
      enum: ["USD", "INR", "EUR"],
      default: "INR",
    },
    frequency: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "monthly", "yearly"],
    },
    category: {
      type: String,
      required: true,
      enum: [
        "entertainment",
        "sports",
        "music",
        "education",
        "news",
        "shopping",
        "other",
      ],
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) { return value <= new Date() },
        message: "Start date must be in the past",
      },
    },
    renewalDate: {
      type: Date,
      validate: {
        validator: function(value) { return value >= this.startDate },
        message: "Renewal date must be after start date",
      },
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    }
  },
  {
    timestamps: true,
  },
);

subscriptionSchema.pre("validate", function() {
    const renewalPeriods = {
        daily: 1,
        weekly: 7,
        monthly: 30,
        yearly: 365
    }

    if(!this.renewalDate) {
        this.renewalDate = new Date(this.startDate) // renewalDate = startDate
        this.renewalDate.setDate(this.renewalDate.getDate() + renewalPeriods[this.frequency]); 
    }

    if(this.renewalDate < new Date()) {
        this.status = "expired"
    }

})

const subscriptionModel = mongoose.model("Subscription", subscriptionSchema)

export default subscriptionModel;