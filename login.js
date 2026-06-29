// Helper function to get trimmed value from an input field
function getVal(id){
  return document.getElementById(id).value.trim();
}

// Displays a message to the user (error or success)
function showMsg(msg,isError=false){
  const el=document.getElementById("loginMsg");
  el.textContent=msg;
  el.style.color=isError?"red":"green";
}

// Clears any login message when user edits inputs
function clearMsg(){
  document.getElementById("loginMsg").textContent="";
}

// Resets demo data by clearing localStorage
function resetDemo(){
  localStorage.clear();

  const msg=document.getElementById("loginMsg");
  msg.textContent="Demo reset successfully";
  msg.style.color="green";
}

/* HARDCODED USERS
   This serves as a simple in-memory database for demo login validation */

const USERS=[

{name:"Risha Desai",email:"rsdesai@scu.edu",role:"STUDENT"},
{name:"Tess Wei",email:"twei@scu.edu",role:"STUDENT"},
{name:"Alex Chen",email:"achen@scu.edu",role:"STUDENT"},
{name:"Kai Wong",email:"kwong@scu.edu",role:"STUDENT"},
{name:"Maria Lopez",email:"mlopez@scu.edu",role:"STUDENT"},
{name:"David Kim",email:"dkim@scu.edu",role:"STUDENT"},
{name:"Emily Zhang",email:"ezhang@scu.edu",role:"STUDENT"},
{name:"Ryan Patel",email:"rpatel@scu.edu",role:"STUDENT"},
{name:"Sophia Park",email:"spark@scu.edu",role:"STUDENT"},
{name:"Lucas Brown",email:"lbrown@scu.edu",role:"STUDENT"},

{name:"Prof John Smith",email:"jsmith@scu.edu",role:"ADMIN"},
{name:"Prof Maria Garcia",email:"mgarcia@scu.edu",role:"ADMIN"},
{name:"Prof Daniel Lee",email:"dlee@scu.edu",role:"ADMIN"},
{name:"Prof Sarah Johnson",email:"sjohnson@scu.edu",role:"ADMIN"}

];

/* CLEAR MESSAGE WHEN USER TYPES
   Improves UX by removing error messages as the user edits inputs */

document.getElementById("name").addEventListener("input",clearMsg);
document.getElementById("email").addEventListener("input",clearMsg);
document.getElementById("role").addEventListener("change",clearMsg);


/* LOGIN BUTTON HANDLER
   Validates credentials and routes the user to the correct dashboard */

document.getElementById("loginBtn").onclick=function(){

const name=getVal("name");
const email=getVal("email").toLowerCase();
const role=getVal("role");

// Ensure required fields are filled
if(!name||!email){
showMsg("Please fill in all fields",true);
return;
}

// Enforce SCU email requirement
if(!email.endsWith("@scu.edu")){
showMsg("Must use SCU email",true);
return;
}

// Find matching user in the hardcoded user list
const user=USERS.find(u=>u.name===name && u.email===email);

if(!user){
showMsg("That is not valid login information",true);
return;
}

// Ensure selected role matches stored role
if(role!==user.role){
showMsg("Incorrect role selected for this account",true);
return;
}

// Store logged-in user in localStorage so other pages can access it
localStorage.setItem("currentUser",JSON.stringify(user));

// Redirect user based on role
if(role==="ADMIN"){
window.location.href="./admin.html";
}else{
window.location.href="./index.html";
}

}