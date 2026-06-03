import mongoose from "mongoose";

// FAT model SKINNY controller focus

const sessionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionTokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    refreshTokenHash: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
    status: {
      type: String,
      enum: ["active", "logged_out", "revoked", "expired"],
      default: "active",
      index: true,
    },
    loginAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    logoutAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    deletesAt: {
      type: Date,
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: null,
    },
    userAgent: {
      type: String,
      trim: true,
      default: null,
    },
    device: {
      name: {
        type: String,
        trim: true,
        default: "Unknown device",
      },
      type: {
        type: String,
        enum: ["desktop", "mobile", "tablet", "bot", "unknown"],
        default: "unknown",
      },
      os: {
        type: String,
        trim: true,
        default: null,
      },
      browser: {
        type: String,
        trim: true,
        default: null,
      },
      location: {
        country: {
          type: String,
          trim: true,
          default: null,
        },
        region: {
          type: String,
          trim: true,
          default: null,
        },
        city: {
          type: String,
          trim: true,
          default: null,
        },
      },
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    revokeReason: {
      type: String,
      required: true,
      trim: true,
      maxLength: 250,
      default: null,
    },
    endedBy: {
      type: String,
      enum: ["user", "system", "admin", null],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // For including virtuals in JSON output, res.send(session)
    toObject: { virtuals: true }, // For including virtuals in variables, console.log(session)
  },
);

// QUERY ARCHITECTURE - ESR principle - equality, sort, range

sessionSchema.index({ user: 1, status: 1, lastActiveAt: -1 }); // Compound index, works for queries such as model.find() with filters - user, status or lastActiveAt for quick operation time. Follows LTR
sessionSchema.index({ deletesAt: 1 }, { expireAfterSeconds: 0 }); // TTL - only for single field indexes

sessionSchema.virtual("isActive").get(function() { // Used in controller logic - Document.isActive - promotes DRY
  return this.status === "active" && this.expiresAt > new Date();
});

// METHODS, similar to session.save() - must be used with ASYNC/AWAIT

sessionSchema.methods.markActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

sessionSchema.methods.endSession = function(endedBy = "user") {
  this.status = "logged_out";
  this.logoutAt = new Date();
  this.endedBy = endedBy;
  return this.save();
};

sessionSchema.methods.revoke = function(revokedBy, revokeReason = "Session revoked") {
  this.status = "revoked";
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.revokeReason = revokeReason;
  this.endedBy = "user";
  return this.save();
};

sessionSchema.pre("validate", function() {
  if(this.expiresAt && this.expiresAt <= new Date() && this.status === "active") {
    this.status = "expired";
    this.endedBy = "system";
  }

  if(this.status === "logged_out" && !this.logoutAt) {
    this.logoutAt = new Date();
  }

  if(this.status === "revoked" && !this.revokedAt) {
    this.revokedAt = new Date();
  }
});

const sessionModel = mongoose.model("Session", sessionSchema);

export default sessionModel;
