const mong=require("mongoose");


function main()
{
   mong.connect(process.env.DB_Connect, {

  useNewUrlParser: true,
  useUnifiedTopology: true,

 
  serverSelectionTimeoutMS: 30000, 

  
  socketTimeoutMS: 45000,

 
  maxPoolSize: 10
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(" MongoDB connection error:", err));
}
module.exports=main
