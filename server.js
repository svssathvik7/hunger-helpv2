// Program imports
const es = require("express");
const app = es();
const bp = require("body-parser");
const fs = require("fs");

app.use(bp.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(es.static("public"));

app.get("/donate-food",(req,res)=>{
    res.render("donate_food");
});

app.get("/request-food",(req,res)=>{
    res.render("req_food");
});

app.get("/statistics",(req,res)=>{
    res.render("stats");
});

app.get("/about",(req,res)=>{
    res.render("about");
});

app.listen(3000,()=>{
    console.log("Running");
});

// Home page code
const title_txt = "Welcome to HungerHelp!";
const desc_txt = "Together, we are tackling hunger and making a difference in our community. At HungerHelp, we connect local food establishments, food banks, shelters, and individuals in need, creating a seamless platform to reduce food waste and address food insecurity. Through our web application, you can easily donate surplus food, volunteer your time, and ensure that no one goes hungry. Join us in this meaningful mission and make a positive impact on the lives of others.";
const emphasis_txt = "Together, we can fight hunger, one meal at a time.";
const curFeedbackState = true;
var statBoxData = [
    {
        key : 1,
        alt : "donations",
        src : "https://static.vecteezy.com/system/resources/previews/004/327/955/original/donation-box-throwing-hearts-in-a-box-for-donations-donate-giving-money-and-love-concept-of-charity-give-and-share-your-love-with-people-humanitarian-volunteer-activity-vector.jpg",
        desc : "Donations",
        count : 150
    },
    {
        key : 2,
        alt : "volunteers",
        src : "https://media.istockphoto.com/id/931069122/vector/icon-with-the-concept-of-family-care-care-about-humanity.jpg?s=612x612&w=0&k=20&c=RWgHjgTaVOwdSQtPQcqQcTZ8t0MHdie7Jr0bnHZKvZc=",
        desc : "Volunteers",
        count : 80
    },
    {
        key : 3,
        alt : "members image",
        src : "https://orgalim.eu/sites/default/files/styles/large/public/pebble_impressive_image/group-chat%20%281%29.png?itok=efpAi0Cl",
        desc : "Members",
        count : 15
    },
    {
        key : 4,
        alt : "love image",
        src : "https://static.thenounproject.com/png/1592695-200.png",
        desc : "Fed",
        count : 300
    }
];
const aside_img = [
    "https://media.istockphoto.com/id/1355624220/vector/vector-illustration-please-dont-waste-food-designs-for-world-food-day-and-international.jpg?s=612x612&w=0&k=20&c=_noGR7l39IG46d6RGE4x54DBC8sg1pD1xzDUfz5pb4E=",
    "https://i.pinimg.com/736x/bd/42/24/bd4224bdc0d7361c33324daba0c59b53.jpg"
];
app.get("/",function(req,res)
{
    res.render("index",{titleTxt:title_txt,descTxt:desc_txt,emphasis:emphasis_txt,obj:statBoxData,imgsrc:aside_img[[Math.round(Math.random())]]});
});

// Join page
var card_Data = [
    {
        title : "Member",
        desc : "Join as a Member with HungerHelp and make a difference in fighting food waste and hunger. As a member, you can contribute surplus food from your restaurant or become a donor by supporting our mission financially. By partnering with us, you'll help redirect perfectly good food to those in need and actively participate in building a more sustainable and compassionate community. Together, we can reduce food waste and ensure that no one goes hungry.",
        func : "cardClicked1"
    },
    {
        title : "Volunteer",
        desc : "Volunteer with HungerHelp and make a meaningful impact in your community. Join our dedicated team of volunteers to help collect and distribute surplus food, organize food drives, assist at local events, and spread awareness about food waste and hunger. By volunteering with us, you can be a part of the solution and contribute to creating a hunger-free future for all.",
        func : "cardClicked2"
    }
];
app.get("/join",function(req,res)
{
    res.render("join",{cardData:card_Data});
});

app.get("/signupform",function(req,res){
    res.render("register");
});

app.post("/submitform",(req,res)=>{
    var uname = req.body.username;
    var umail = req.body.usermail;
    var ufeedback = req.body.userfeedback;
    const formData = `Username: ${uname}\nUsermail: ${umail}\nUserfeedback: ${ufeedback}\n\n`;

  // Append the form data to a file
    fs.appendFile(__dirname+"/views/data.txt", formData, (error) => {
    if (error) {
      console.log("Error occurred while writing to file:", error.message);
      res.redirect("/"); // Redirect to home page or handle the error accordingly
    }
    console.log("Form data written to file successfully"); // Redirect to home page or a success page
  });
    res.redirect("/");
});
