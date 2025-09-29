const mong=require("mongoose");


function main()
{
   console.log(process.env.DB_CONNECT);
   mong.connect(process.env.DB_CONNECT, {

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
