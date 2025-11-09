const userModel = require('../models/user.model');


module.exports.createUser=async({FirstName,LastName,Email,pasword})=>{
    console.log(FirstName);
    if(!FirstName|| !Email || !pasword){
        throw new Error("all feilds are required..");
    }
    
    const user=userModel.create({
        FullName:{
            FirstName,
            LastName
        },
        Email,
        pasword
    })
    return user;
}

module.exports.updateUser = async ({ userId, FirstName, LastName, Email }) => {
    if (!userId) throw new Error('userId required');
    const update = {};
    if (FirstName || LastName) {
        update['FullName'] = {};
        if (FirstName) update.FullName.FirstName = FirstName;
        if (LastName) update.FullName.LastName = LastName;
    }
    if (Email) update.Email = Email;
    if (Object.keys(update).length === 0) throw new Error('No fields to update');
    const user = await userModel.findByIdAndUpdate(userId, update, { new: true, runValidators: true });
    return user;
}

module.exports.getUserByEmail = async (Email) => {
    if (!Email) throw new Error('Email required');
    const user = await userModel.findOne({ Email });
    return user;
}

module.exports.updateUserPassword = async ({ userId, hashedPassword }) => {
    if (!userId || !hashedPassword) throw new Error('userId and hashedPassword required');
    const user = await userModel.findByIdAndUpdate(
        userId,
        { pasword: hashedPassword },
        { new: true }
    );
    return user;
}
