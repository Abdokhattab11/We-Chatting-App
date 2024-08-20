const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:[true,"First Name is required"],
        minLength:[3,"First Name must be at least 3 characters"],
        maxLength:[50,"First Name must be at most 50 characters"]
    },
    lastName:{
        type:String,
        required:[true,"Last Name is required"],
        minLength:[3,"Last Name must be at least 3 characters"],
        maxLength:[50,"Last Name must be at most 50 characters"]
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:[true,"Email must be unique"],
        match:/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    },
    password:{
        type:String,
        required:[true,"Password is required"]
    },
    photo:{
        type:String,
        default:"default.webp"
    },
});

module.exports = mongoose.model("User", userSchema);