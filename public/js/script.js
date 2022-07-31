//Even Listeners
var targetLinks = document.getElementsByName("target");
for (targetLink of targetLinks){
  targetLink.addEventListener("click", getWorkoutInfo);
}

var bodyPartLinks = document.getElementsByName("bodyPart");
for (bodyPartLink of bodyPartLinks){
  bodyPartLink.addEventListener("click", getWorkoutInfo);
}

let searchButton = document.querySelector("#button-addon2");
if(searchButton !== null){
  searchButton.addEventListener("click", getWorkoutInfo);
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
  exercise.innerHTML="";
  
  if(workouts.length == 0){
    exercise.innerHTML='<h5 class="text-center"><b>Not Found...</b></h5>';
  }
  else{
    exercise.innerHTML="";
  
    for(workout of workouts){
      exercise.innerHTML +=`<div class="col">
      <div>
        <img src="${workout.gifUrl}" class="card-img-top" alt="${workout.name}">
        <div class="card-body">
          <h5 class="card-title"><b>Workout</b>: ${workout.name}</h5>
          <p class="card-text"><b>Body Part</b>: ${workout.bodyPart}</p>
          <p class="card-text"><b>Target</b>: ${workout.target}</p>
          <p class="card-text"><b>Equipment</b>: ${workout.equipment}</p>
        </div>
      </div>
    </div>`;
    }
  }
}

var hours =0;
var mins =0;
var seconds =0;

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

