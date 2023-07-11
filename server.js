// Program imports
const es = require("express");
const app = es();
const bp = require("body-parser");

app.use(bp.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(es.static("public"));

app.get("/donate-food",(req,res)=>{
    res.render("donate_food");
});

app.get("/request-food",(req,res)=>{
    res.render("donate_food");
});

app.get("/statistics",(req,res)=>{
    res.render("donate_food");
});

app.get("/join",(req,res)=>{
    res.render("donate_food");
});

app.get("/about",(req,res)=>{
    res.render("donate_food");
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
app.get("/",function(req,res)
{
    res.render("index",{titleTxt:title_txt,descTxt:desc_txt,emphasis:emphasis_txt,feedbackState:curFeedbackState,obj:statBoxData});
});

// Join page
app.get("/join",function(req,res)
{
    res.render("join",{feedbackState:curFeedbackState});
});