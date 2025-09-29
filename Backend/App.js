const dotenv=require("dotenv");
dotenv.config();
const expres=require("express");
const cors=require("cors");
const main=require("./Db/Db");
const cookieParser=require("cookie-parser");
const app=expres();
const userRoute=require("./routes/user.routes");
const captainRoute=require("./routes/captain.routes");
const mapsRoutes=require("./routes/map.routes");
const rideRoutes = require('./routes/ride.routes');


main();
app.use(cors());
app.use(expres.json());
app.use(expres.urlencoded({extended:true}));
app.use(cookieParser());

app.use("/users",userRoute);
app.use("/captains",captainRoute);
app.use('/maps',mapsRoutes);
app.use('/rides', rideRoutes);
app.get("/",(req,res)=>{
    res.send("Helloo world")
});


module.exports = app;
