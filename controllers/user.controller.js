import userModel from "../models/user.model.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await userModel.find();

    if(users.length <= 0) {
      const error = new Error("No users Found")
      error.statusCode = 404
      throw error
    }

    res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        users,
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {

  try {

    const id = req.params.id
    const user = await userModel.findById(id).select("-password")

    if(!user) {
        const error = new Error("User not found")
        error.statusCode = 404
        throw error
    }

    res.status(200).json({
        success: true,
        message: "User fetched successfully",
        user
    })

  } catch (error) {
    next(error);
  }

};