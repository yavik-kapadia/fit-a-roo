//Event Listeners
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

//Functions
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
    searchMsg.innerHTML='<h4 class="text-center" style="color: red;"><b>NOT FOUND...</b></h4>';
  }
  else{
    searchMsg.innerHTML=`<h4 class="text-center" style="color: white;"><b>Displaying "${value}" exercises </b></h4>`;
  
    for(workout of workouts){
      exercise.innerHTML +=`<div class="col"><br>
      <div class="workoutCard">
        <h5 class="text-center"><b>${workout.name}</b></h5>
        <br>
      </div>
      <div class="text-center" id="viewInfoDiv">
          <button class="btn btn-fit" href="#" onclick="getModalInfo(${workout.id})">View Info</button>
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