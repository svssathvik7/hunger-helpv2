// Program imports
import dotenv from "dotenv";
dotenv.config();
import fetch from "node-fetch";
import express from "express";
const app = express();
import bodyParser from "body-parser";
import browserDetect from "browser-detect";
import md5 from "md5";
var isLoggedIn = false;
var devtxt = "ML, Responsiveness added!";
var errmsg = "";
import mongoose, { Schema } from "mongoose";
var availableFood = [];
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));
var isadminbool = false;
var curryear = new Date().getFullYear();

// Database connection
mongoose.connect(
  "mongodb+srv://sathvikcodes:sathvikcodes@cluster0.hyujunf.mongodb.net/?retryWrites=true&w=majority"
);
var db = mongoose.connection;
db.on("error", () => console.log("Error in connection to Database"));
db.once("open", () => console.log("Connected to Database Successfully"));

const MemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  orgname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true
  },
  isAdmin:{
    type: Boolean,
    required: true,
  },
});

const DonateSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
  },
  ftype: {
    type: String,
    required: true,
  },
  quality: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  organisation: {
    type: String,
    required: true,
  },
  expiry: {
    type: BigInt,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

const BiogasSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true,
  },
  organisation: {
    type: String,
    required: true,
  },
});


var Memberdb = new mongoose.model("members", MemberSchema);
var Fooddb = new mongoose.model("food", DonateSchema);
var Biogasdb = new mongoose.model("biogas", BiogasSchema);
const DonorSchema = new mongoose.Schema({
  email : {
    ref : "members",
    required: true,
    type: Schema.Types.ObjectId,
  },
  orgname: {
    type: String,
    required: true,
    ref : "Memberdb",
  },
  quantity : {
    type: Number,
    required : true,
  }
});
const donorDb = new mongoose.model("donor",DonorSchema);
// Home page code

const title_txt = "Welcome to HungerHelp!";
const desc_txt = [
  "Together, we are tackling hunger and making a difference in our community. At HungerHelp, we connect local food establishments, food banks, shelters, and individuals in need, creating a seamless platform to reduce food waste and address food insecurity. Through our web application, you can easily donate surplus food, volunteer your time, and ensure that no one goes hungry. Join us in this meaningful mission and make a positive impact on the lives of others.",
  "Together, we are joining forces to combat hunger and make a positive impact in our community. At HungerHelp, we foster connections between local food establishments, food banks, shelters, and individuals in need, offering a seamless platform to reduce food waste and address food insecurity. With our user-friendly web application, you can effortlessly donate surplus food, volunteer your time, and help ensure that no one goes hungry. Join us in this meaningful mission to improve the lives of others.",
  "Working together, we are addressing hunger and creating change in our community. At HungerHelp, we bring together local food establishments, food banks, shelters, and those in need, establishing an efficient platform to combat food waste and tackle food insecurity. Using our intuitive web application, you can easily contribute surplus food, volunteer your time, and play a vital role in ensuring that everyone has enough to eat. Join us in this important endeavor to make a positive difference in the lives of many.",
  "Collaboratively, we are taking on the challenge of hunger and making a significant impact in our community. HungerHelp connects local food establishments, food banks, shelters, and individuals in need, providing a streamlined platform to minimize food waste and address food insecurity. Through our accessible web application, you can conveniently donate surplus food, volunteer your time, and help ensure that no one experiences hunger. Join us in this meaningful cause to positively transform lives.",
  "In unity, we are combatting hunger and bringing about positive change in our community. HungerHelp facilitates connections between local food establishments, food banks, shelters, and those in need, creating an integrated platform to reduce food waste and combat food insecurity. Utilize our user-friendly web application to easily contribute surplus food, offer your time as a volunteer, and contribute to the cause of ensuring that no one goes without food. Join us in this purposeful mission to impact lives for the better.",
];
const emphasis_txt = "Together, we can fight hunger, one meal at a time.";
const curFeedbackState = true;
var volunteercnt = 0;
var membercnt = 0;
async function getMembersCounts() {
  volunteercnt = await Memberdb.countDocuments({ role: "volunteer" });
  membercnt = await Memberdb.countDocuments({ role: "member" });
  return [volunteercnt, membercnt];
}
async function getDonationCount() {
  var numdonations = await Fooddb.countDocuments({
    expiry: { $gt: new Date().getTime() },
  });
  return numdonations;
}
async function getBiogasCount() {
  var numbio = await Biogasdb.countDocuments({});
  return numbio;
}
var statBoxData = [
  {
    key: 1,
    alt: "biogas",
    src: "/bio-gas.svg",
    desc: "Biogas",
    count: Biogasdb.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
        },
      },
    ]).then((result) => {
      var biocount = result[0].totalQuantity;
      biocount = biocount * 0.03;
      statBoxData[0].count = biocount.toPrecision(3) + "m³";
    }),
  },
  {
    key: 2,
    alt: "volunteers",
    src: "/volunteer-card.svg",
    desc: "Volunteers",
    count: getMembersCounts().then((countval) => {
      statBoxData[1].count = countval[0];
      statBoxData[2].count = countval[1];
    }),
  },
  {
    key: 3,
    alt: "members image",
    src: "/members.svg",
    desc: "Members",
    count: membercnt,
  },
  {
    key: 4,
    alt: "love image",
    src: "/heart.svg",
    desc: "Fed",
    count: 0,
  },
  {
    key: 5,
    alt: "donations",
    src: "/donatepic.svg",
    desc: "Donations",
    count: getDonationCount().then((donationCount) => {
      statBoxData[4].count = donationCount;
      getBiogasCount().then((biocount) => {
        statBoxData[4].count += biocount;
      });
    }),
  },
];
const aside_img = [
  "https://media.istockphoto.com/id/1355624220/vector/vector-illustration-please-dont-waste-food-designs-for-world-food-day-and-international.jpg?s=612x612&w=0&k=20&c=_noGR7l39IG46d6RGE4x54DBC8sg1pD1xzDUfz5pb4E=",
  "https://i.pinimg.com/736x/bd/42/24/bd4224bdc0d7361c33324daba0c59b53.jpg",
  "https://media.istockphoto.com/id/1223169200/vector/food-and-grocery-donation.jpg?s=612x612&w=0&k=20&c=0fv8hwXeS9RCL-ewqkr2oyi0Nu8jAQxGtroS0XA9nsQ=",
  "https://cdn1.i-scmp.com/sites/default/files/styles/1200x800/public/2013/10/16/4541f88991b90cae31fe995a28027086.jpg?itok=w_-PQMW2",
  "https://static.vecteezy.com/system/resources/previews/013/926/882/original/biofuel-life-cycle-of-natural-materials-and-plants-with-green-barrels-or-biogas-production-energy-in-flat-cartoon-hand-drawn-templates-illustration-vector.jpg",
];
app.get("/", async (req, res) => {
  const currentTime = new Date().getTime(); // Get current time in milliseconds

// Find and process expired food items
Fooddb.find({ expiry: { $lte: currentTime } })
  .then(async (expiredFoodItems) => {
    for (const item of expiredFoodItems) {
      const existingBiogasEntry = await Biogasdb.findOne({
        organisation: item.organisation,
      });

      if (existingBiogasEntry) {
        // Update the existing Biogasdb entry by adding the current quantity
        await Biogasdb.findOneAndUpdate(
          { organisation: item.organisation },
          { $set: { quantity: existingBiogasEntry.quantity + item.quantity } }
        );
      } else {
        // Insert a new Biogasdb entry
        const newBiogasEntry = new Biogasdb({
          quantity: item.quantity,
          organisation: item.organisation,
        });
        await newBiogasEntry.save();
      }
    }

    // Remove expired food items from Fooddb
    const deleteResult = await Fooddb.deleteMany({
      _id: { $in: expiredFoodItems.map((item) => item._id) },
    });

    console.log(`${deleteResult.deletedCount} items removed from Fooddb.`);
  })
  .catch((err) => {
    console.error(err);
  });
  await Biogasdb.aggregate([
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: "$quantity" },
      },
    },
  ]).then((result) => {
    var biocount = result[0].totalQuantity;
    biocount = biocount * 0.03;
    statBoxData[0].count = biocount.toPrecision(3) + "m³";
  });
  isLoggedIn = false;
  errmsg = "";
  var isMobile = browserDetect(req.headers["user-agent"]).mobile;
  if (!isMobile) {
    res.render("desktop/index", {
      cdevmsg: devtxt,
      titleTxt: title_txt,
      descTxt: desc_txt[[Math.floor(Math.random() * desc_txt.length)]],
      emphasis: emphasis_txt,
      obj: statBoxData,
      imgsrc: aside_img[[Math.floor(Math.random() * aside_img.length)]],
      isAdmin : isadminbool
    });
  } else {
    res.render("mobile/index", {
      cdevmsg: devtxt,
      titleTxt: title_txt,
      descTxt: desc_txt[[Math.floor(Math.random() * desc_txt.length)]],
      emphasis: emphasis_txt,
      obj: statBoxData,
      imgsrc: aside_img[[Math.floor(Math.random() * aside_img.length)]],
    });
  }
});

// Join page
app.get("/register", function (req, res) {
  var isMobile = browserDetect(req.headers["user-agent"]).mobile;
  if (isMobile) {
    res.render("mobile/register");
  } else {
    res.render("desktop/register", { cdevmsg: devtxt, isAdmin: isadminbool });
  }
});

app.post("/submitform", (req, res) => {
  res.redirect("/");
});

app.post("/newuser", async (req, res) => {
  var data = new Memberdb({
    name: req.body.name,
    orgname: req.body.orgname,
    email: req.body.email,
    password: md5(req.body.password),
    role: req.body.role,
  });
  try {
    await data.save();
    if (data.role == "volunteer") {
      statBoxData[1].count++;
      res.render("desktop/success", { cdevmsg: devtxt,isAdmin: isadminbool });
    } else {
      statBoxData[2].count++;
      res.render("desktop/success", { cdevmsg: devtxt,isAdmin:isadminbool });
    }
  } catch (error) {
    console.log("Error saving");
    res.render("desktop/failentry", { cdevmsg: devtxt });
  }
});

// Donate food
app.get("/donate-food", (req, res) => {
  var isMobile = browserDetect(req.headers["user-agent"]).mobile;
  if (isMobile) {
    res.render("mobile/donate_food", {
      loginState: isLoggedIn,
      errortxt: errmsg,
    });
  } else {
    res.render("desktop/donate_food", {
      cdevmsg: devtxt,
      loginState: isLoggedIn,
      errortxt: errmsg,
      isAdmin: isadminbool
    });
  }
});
app.post("/login", async (req, res) => {
  var lmail = req.body.email;
  var lpass = md5(req.body.password);
  try {
    var userLoggingIn = await Memberdb.findOne({ email: lmail });
    if (userLoggingIn) {
      if (userLoggingIn.password === lpass) {
        isLoggedIn = true;
        if(userLoggingIn.isAdmin)
        {
          res.redirect(req.get('referer'));
          console.log("its admin");
          isadminbool = true;
        }
        else{
          res.redirect(req.get("referer"));
          console.log("Login detected");
        }
      } else {
        errmsg = "Password incorrect";
        isLoggedIn = false;
        res.redirect(req.get("referer"));
      }
    } else {
      errmsg = "No user found";
      isLoggedIn = false;
      res.redirect(req.get("referer"));
    }
  } catch (error) {
    console.log(error);
  }
});
app.post("/addFood", async (req, res) => {
  var expirationTimestamp = new Date().getTime();
  var expirationTime = expirationTimestamp + req.body.expiry * 1000 * 60;
  var foodid = req.body.organisation + expirationTime;

  var data = new Fooddb({
    id: foodid,
    ftype: req.body.foodtype,
    quality: req.body.quality,
    quantity: parseInt(req.body.quantity),
    contact: req.body.contactnumber,
    organisation: req.body.organisation,
    expiry: expirationTime,
    message: req.body.custommessage,
  });

  try {
    await data.save();
    statBoxData[4].count = statBoxData[4].count + 1;
    res.redirect("/donate-food");
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred while adding food entry.");
  }
});

// Request food
app.get("/request-food", async (req, res) => {
  var availableFood = [];
  var availableFood = await Fooddb.find({});
  var isMobile = browserDetect(req.headers["user-agent"]).mobile;
  if (isMobile) {
    res.render("mobile/req_food", {
      loginState: isLoggedIn,
      errortxt: errmsg,
      data: availableFood,
      isAdmin: isadminbool
    });
  } else {
    res.render("desktop/req_food", {
      cdevmsg: devtxt,
      loginState: isLoggedIn,
      errortxt: errmsg,
      data: availableFood,
      isAdmin: isadminbool
    });
  } // Handle the error appropriately, e.g., display an error message
});

app.get("/statistics", (req, res) => {
  var isMobile = browserDetect(req.headers["user-agent"]).mobile;
  if (isMobile) {
    res.render("mobile/stats", {
      predictionDone: false,
      loginState: isLoggedIn,
      errortxt: errmsg,
    });
  } else {
    res.render("desktop/stats", {
      loginState: isLoggedIn,
      errortxt: errmsg,
      cdevmsg: devtxt,
      predictionDone: false,
      predictionDone1: false,
      predictionDone2: false,
      year: curryear,
      isAdmin: isadminbool
    });
  }
});

const faq = [
  {
    key: 1,
    question : "What is the main motto of HungerHelp?",
    answer : "Together, we are tackling hunger and making a difference in our community. At HungerHelp, we connect local food establishments, food banks, shelters, and individuals in need, creating a seamless platform to reduce food waste and address food insecurity. Through our web application, you can easily donate surplus food, volunteer your time, and ensure that no one goes hungry. Join us in this meaningful mission and make a positive impact on the lives of others."
  },
  {
    key : 2,
    question : "Does HungerHelp expect any kind of remuneration?",
    answer : "Introducing 'HungerHelp' - a compassionate non-profit organization dedicated to eradicating hunger's plight. With unwavering determination and your support, we strive to bring hope and nourishment to those in need. Join us in our mission to create a world where no one goes to bed hungry."
  },
  {
    key : 3,
    question : "Contact for any design suggestions",
    answer : "For any design queries or technical contact kindly reach sathvikworkmail@gmail.com. For any feedback related elements feel free to use the feedback form :)"
  },
  {
    key : 4,
    question : "Do i get paid if I join in HungerHelp?",
    answer : "HungerHelp is purely a non-profit organisation which has been running on our self interest for now without any financial aid, So we would love to take volunteers who works for love :)"
  },
  {
    key : 5,
    question : "How can I join as a volunteer?",
    answer : "Thanks for your interest please navigate to join page."
  }
]
app.get("/about", (req, res) => {
  var isMobile = browserDetect(req.headers["user-agent"]).mobile;
  if (isMobile) {
    res.render("mobile/about");
  } else {
    res.render("desktop/about", { cdevmsg: devtxt, faq_obj: faq,isAdmin:isadminbool });
  }
});

app.post("/callbiogasprediction", async (req, res) => {
  console.log("Predict button clicked!");
  var biogasqty = req.body.biogasqty;
  var url = "https://sathvik-biogas-predictor.onrender.com/getprediction";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ food_waste: parseFloat(biogasqty) }),
    });

    if (!response.ok) {
      throw new Error("Error from Flask server");
    }

    var predictedData = await response.json();
    predictedData = parseFloat(predictedData.estimation);
    predictedData = predictedData / 10;
    predictedData = predictedData.toFixed(2);
    console.log(predictedData);
    // Send the data received from the Flask server as a response
    var isMobile = browserDetect(req.headers["user-agent"]).mobile;
    if (isMobile) {
      res.render("mobile/stats", {
        loginState: isLoggedIn,
        errortxt: errmsg,
        predictionDone: true,
      });
    } else {
      res.render("desktop/stats", {
        cdevmsg: devtxt,
        predictionDone: true,
        predicteddata: predictedData,
        biomass: biogasqty,
        predictionDone1: false,
        predictionDone2: false,
        year: curryear,
        loginState: isLoggedIn,
        errortxt: errmsg,
        isAdmin : isadminbool
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/gethungerstatsprediction", (req, res) => {
  var optselecteddata = req.body.dateRange;
  const currstatdata = {
    2023: "<iframe title='People who died from hunger' src='https://www.theworldcounts.com/embeds/counters/2?background_color=white&color=black&font_family=%22Helvetica+Neue%22%2C+Arial%2C+sans-serif&font_size=14' style='border: none' height='100' width='300'></iframe>",
    thisMonth:
      "<iframe title='People who died from hunger' src='https://www.theworldcounts.com/embeds/counters/2?background_color=white&color=black&font_family=%22Helvetica+Neue%22%2C+Arial%2C+sans-serif&font_size=14' style='border: none' height='100' width='300'></iframe>",
    thisWeek:
      "<iframe title='People who died from hunger' src='https://www.theworldcounts.com/embeds/counters/2?background_color=white&color=black&font_family=%22Helvetica+Neue%22%2C+Arial%2C+sans-serif&font_size=14' style='border: none' height='100' width='300'></iframe>",
    today:
      "<iframe title='People who died from hunger' src='https://www.theworldcounts.com/embeds/counters/2?background_color=white&color=black&font_family=%22Helvetica+Neue%22%2C+Arial%2C+sans-serif&font_size=14' style='border: none' height='100' width='300'></iframe>",
  };
  res.send(currstatdata[optselecteddata]);
});

app.post("/foodrequest", async (req, res) => {
  var qtyfood = await Fooddb.findOne({ id: req.body.cardid });
  res.redirect(req.get("referer"));
  console.log("Food purchased");
});

const admindata = [
  {
    title : "Add-Admin",
    desc : "You can add further admins who can monitor the HungerHelp's data of donors and etc!"
  },
  {
    title : "Top-Donors",
    desc : "Check the donors who contributed large amounts of services to the society through HungerHelp"
  }
]
const users = await Memberdb.find({});
app.get("/ad-tools",(req,res)=>{
  if(isadminbool)
  {
    res.render("desktop/admintools",{isAdmin:isadminbool,adminCardData:admindata,users:users});
  }
  else{
    res.render("desktop/nofilefound",{isAdmin:isadminbool});
  }
});

app.post("/adminChange", async(req, res) => {
  const adminAction = await req.body['admin-submit-btn'];
  const selectedMails = await req.body["emails-list"];
  // console.log(selectedMails);
  if (adminAction === 'add') {
    try{
      const result = await Memberdb.updateMany({email:{"$in":selectedMails}},
      {isAdmin:true});
      console.log(result);
    }
    catch(error){
      console.log(error);
    }
  } else if (adminAction === 'remove') {
      try{
        const result = await Memberdb.updateMany({email:{"$in":selectedMails}},{isAdmin:false});
        console.log(result);
      }
      catch(error){
        console.log(error);
      }
  }

  // Continue with your form processing logic

  // Send a response to the client
  res.send('Form submitted successfully');
});



app.listen(3000, () => {
  console.log("Running");
});


app.use((req, res, next) => {
  res.status(404).render("desktop/nofilefound",{isAdmin:isadminbool});
});