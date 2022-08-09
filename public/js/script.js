//Even Listeners
document.getElementById("#loginButton").addEventListener("click", validateLogin);

var targetLinks = document.getElementsByName("target");
for (targetLink of targetLinks){
  targetLink.addEventListener("click", getWorkoutInfo);
}

var bodyPartLinks = document.getElementsByName("bodyPart");
for (bodyPartLink of bodyPartLinks){
  bodyPartLink.addEventListener("click", getWorkoutInfo);
}

var viewWorkoutLinks = document.getElementsByName("viewWorkoutInfo");
for (viewWorkoutLink of viewWorkoutLinks){
  viewWorkoutLink.addEventListener("click", getModalInfo);
}

let searchButton = document.querySelector("#button-addon2");
if(searchButton !== null){
  searchButton.addEventListener("click", getWorkoutInfo);
}

async function validateLogin(){
  let username = document.getElementById("#username").value;
  isValid = true;
  console.log(username);
  if (username == "") {
    isValid = false;
    preventDefault();
  }
  else{
    isValid = true;
    return
  }

async function getWorkoutInfo(){

  let value = this.id;
  let keyword = document.querySelector("#keyword").value;
  
  if(keyword != "" && this.id === "button-addon2"){
    value = keyword;
    console.log(value);
  }
  
  let url = `/api/workout/${value}`;
  let response = await fetch(url);
  let workouts = await response.json();

  let exercise = document.querySelector("#cards");
  let searchMsg = document.querySelector("#searchMsg"); 
  
  exercise.innerHTML="";
  searchMsg.innerHTML="";
  
  if(workouts.length == 0){
    searchMsg.innerHTML='<h5 class="text-center"><b>NOT FOUND...</b></h5>';
  }
  else{
    searchMsg.innerHTML=`<h5 class="text-center"><b>DISPLAYING "${value}" EXERCISES </b></h5>`;
  
    for(workout of workouts){
      exercise.innerHTML +=`<div class="col"><br>
      <div class="workoutCard">
        <h5 class="card-title"><b>Workout</b>: ${workout.name}</h5>
        <br><br>
      </div>
      <div class="text-center" id="viewInfoDiv">
          <button class="btn btn-warning" href="#" onclick="getModalInfo(${workout.id})">View Info</button>
        </div>
        <br>
    </div>`;
    }
  }
}

async function getModalInfo(id){
  var myModal = new bootstrap.Modal(document.getElementById('workoutModal'));
  myModal.show();
  console.log(id);
  let url = `/api/workout/${id}`;
  let response = await fetch(url);
  let data = await response.json();
  console.log(data);
  let workoutInfo = document.querySelector("#workoutInfo");
  workoutInfo.innerHTML = `<h4> ${data[0].name}</h4>`;
  workoutInfo.innerHTML += `<img src="${data[0].gifUrl}" width="200" class="center"><br>`;
  workoutInfo.innerHTML += `<b>Body Part</b>: ${data[0].bodyPart}<br>`;
  workoutInfo.innerHTML += `<b>Target</b>: ${data[0].target}<br>`;
  workoutInfo.innerHTML += `<b>Equipment</b>: ${data[0].equipment}<br>`;
}

var hours = 0;
var mins = 0;
var seconds = 0;

$('#start').click(function(){
      startTimer();
});

$('#stop').click(function(){
      clearTimeout(timex);
});

$('#reset').click(function(){
      hours =0;      mins =0;      seconds =0;
  $('#hours','#mins').html('00:');
  $('#seconds').html('00');
});

function startTimer(){
  timex = setTimeout(function(){
      seconds++;
    if(seconds >59){seconds=0;mins++;
       if(mins>59) {
       mins=0;hours++;
         if(hours <10) {$("#hours").text('0'+hours+':')} else $("#hours").text(hours+':');
        }
                       
    if(mins<10){                     
      $("#mins").text('0'+mins+':');}       
       else $("#mins").text(mins+':');
                   }    
    if(seconds <10) {
      $("#seconds").text('0'+seconds);} else {
      $("#seconds").text(seconds);
      }
     
    
      startTimer();
  },1000);
}


