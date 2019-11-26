var firebaseConfig = {
    apiKey: "AIzaSyAuPekpLqLV56YcD7WHngFCmvWgPPLe63Q",
    authDomain: "bugbook-a5ab2.firebaseapp.com",
    databaseURL: "https://bugbook-a5ab2.firebaseio.com",
    projectId: "bugbook-a5ab2",
    storageBucket: "bugbook-a5ab2.appspot.com",
    messagingSenderId: "978071698037",
    appId: "1:978071698037:web:24d3952b6bf15fb774563c",
    measurementId: "G-YR3TBCWD7D"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  firebase.auth.Auth.Persistence.LOCAL;

  $("#btn-login").click(function(){
      var email = $("#email").val();
      var password = $("#password").val();

      if (email !="" && password!= "") {
        var result = firebase.auth().signInWithEmailAndPassword(email, password);

        result.catch(function(error) {
            var errorCode = error.code;
            var errorMessage = error.message;

            console.log(errorCode);
            window.alert("Message: " + errorMessage);
        });
      } else {
        window.alert("Username and/or password are not correct")
      }
  });

  $("#btn-logout").click(function() {
      firebase.auth().signOut();
  });

  $("#btn-sign-up").click(function() {
      var email = $("#email").val();
      var password = $("#password").val();
      var confirmPassword = $("#confirmPassword").val()

      if (email !="" && password!= "" && confirmPassword !="") {
        if (password == confirmPassword) {
            var result = firebase.auth().createUserWithEmailAndPassword(email, password);

            result.catch(function (error) {
                var errorCode = error.code;
                var errorMessage = error.message;

                console.log(errorCode);
                window.alert("Message: " + errorMessage);
            });
        } else {
            window.alert("Passwords do not match"); 
        }
      } else {
        window.alert("Username and/or password are not correct");
      }
  });

  $("#btn-recoverPassword").click(function() {
    var auth = firebase.auth();
    var email = $("#email").val();

    if (email !="") {
        auth.sendPasswordResetEmail(email).then(function() {
            window.alert("Please check your email inbox!")
        })
        .catch(function(error) {
            var errorCode = error.code;
            var errorMessage = error.message;

            console.log(errorCode);
            window.alert(errorMessage);
        });
    } else {
        window.alert("Email cannot be null")
    }
});

$("#btn-update").click(function() {
    var firstName = $('#firstName').val();
    var lastName = $('#lastName').val();
    var company = $('#company').val();
    var role = $('#role').val();

    var rootRef = firebase.database().ref().child("Users");
    var userID = firebase.auth().currentUser.uid;
    var userRef = rootRef.child(userID);
    
    if (firstName != "" && lastName !="" && company !="" && role != "") {
        var userData = {
            "firstName": firstName,
            "lastName": lastName,
            "company": company,
            "role": role
        };
        userRef.set(userData, function(error) {
            if (error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log(errorCode);
                window.alert(errorMessage);
            } else {
                window.location.href = "main.html"
            }
        })
    } else {
        window.alert("One or more details are not complete");
    }
});


firebase.auth().onAuthStateChanged(function(user) {
    var rootRef = firebase.database().ref().child("Users");
    var userID = firebase.auth().currentUser.uid;
    var userRef = rootRef.child(userID);
    console.log(rootRef);
});

// $("#bug-submit").click(function(){
//     const bugName = $("bug-name").val();
//     const description = $("#bug-description").val();
//     document.getElementById("#result").innerHTML = "The bug name is " + bugName + " and the description is " + description;
// });

// Start of Form Display
$("#report-bug").click(function(){
    $("#form-container").toggleClass("d-none");
    $("#form-container").fadeToggle(600);
});

$("#close-form").click(function(){
    $("#form-container").addClass("d-none");
    $("#form-container").fadeToggle(600);
});

//End of Form Display

$("#bug-submit").click(function () {
    var bugName = $("#bug-name").val();
    var description = $("#bug-description").val();
    var bugImage = $("#bug-image").prop("files")[0];
    var validBugImage = false;
    var validImageTypes = ["image/gif", "image/jpeg", "image/png"];

    if (bugImage && validImageTypes.includes(bugImage.type)) {
        validBugImage = true;
    } else if (!bugImage) {
        validBugImage = true;
    };

    if (bugName != "" && description != "" && validBugImage) {
        $("#result").addClass("text-success");
        $("#result").html("Bug successfully created!");
    } else if (bugName == "" && description == "") {
        $("#result").css("color", "red");
        $("#result").html("Please make sure your bug has a name and a description");
    } else if (bugName == "") {
        $("#result").css("color", "red");
        $("#result").html("Please make sure your bug has a name!");
    } else if (description == "") {
        $("#result").css("color", "red");
        $("#result").html("Please make sure your bug has a description!");
    } else if (validBugImage == false) {
        $("#result").css("color", "red");
        $("#result").html("Please make sure your image is a .gif, .png or .jpeg !");
    };



    //***** Start of File Upload and Save to Firebase Storage and Database *****
    var databaseRef = firebase.database().ref().child("Bugs");

    databaseRef.once("value").then(function (snapshot) {
        var name = bugImage["name"];
        var dateString = new Date().getTime();
        var nameComplete = name + "_" + dateString;
        var bugCounter = snapshot.numChildren() + 1;

        var storageRef = firebase.storage().ref().child("Bug Screenshots");
        var bugStorageRef = storageRef.child(nameComplete);

        var uploadTask = bugStorageRef.put(bugImage);

        uploadTask.on("state_changed", 
        function progressBar(snapshot) {
            var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            $('#upload-progress').html(Math.round(percentage) + "%");
            $('#upload-progress').attr("class", "bg-success");
        }, function error(err) {
            console.log(err.message);
        }, function uploadComplete() {
            var user = firebase.auth().currentUser;
            var userName;
            firebase.database().ref('Users/' + user.uid).once("value").then(function(snapshot) {
                var firstName = (snapshot.val() && snapshot.val().firstName);
                var lastName = (snapshot.val() && snapshot.val().lastName);
                userName = firstName + " " + lastName;
            });

            uploadTask.snapshot.ref.getDownloadURL().then(function(downloadUrl){
                var bugData = {
                    "bugID": bugCounter,
                    "bugTitle": bugName,
                    "imageName": nameComplete,
                    "description": description,
                    "uid": user.uid,
                    "name": userName,
                    "image": downloadUrl,
                    "time": new Date().toLocaleString('en-GB', {timeZone: "UTC"}),
                    "status": "Not Started"
                };

                console.log(bugData);

                var newPostRef = databaseRef.push();

                newPostRef.set(bugData, function(err){
                    if (err) {
                        console.log(err.message);
                    } else {
                        console.log("bugData successfully uploaded");
                        window.open("", "_self");
                    }
                    setTimeout(resetForm(), 2000);
                })
            });

        });
    });
    
});

function resetForm() {
    $("#main-form")[0].reset();
    $("#upload-progress").html("Completed");
    console.log("form reset ok");
}

//***** End of File Upload and Save to Firebase Storage and Database *****



//*********** Start of Bug Retrieve and Display **************

var dbBugs = firebase.database().ref().child("Bugs").orderByChild("bugID");

const showAllBugs = () => {dbBugs.on("value", function(bugs){
    if (bugs.exists()) {
        var bugsHtml = "";
        bugs.forEach(function(bug){
                    bugsHtml += "<div class='col-md-5 bg-white m-3 p-3 d-flex flex-column justify-content-between'>";
                        bugsHtml += "<div class='text-center text-dark'><h4>";
                            bugsHtml += bug.val().bugTitle;
                        bugsHtml += "</h4></div>";
                        bugsHtml += "<p class='text-center'> Status: " + bug.val().status + "</p>";
                        bugsHtml += "<br>";
                        bugsHtml += "<div class='d-none' id='bugKey'>";
                            bugsHtml += bug.key;
                        bugsHtml += "</div>";
                        bugsHtml += "<div class='text-dark'>";
                            bugsHtml += bug.val().description;
                        bugsHtml += "</div>";
                        bugsHtml += "<br>";
                        bugsHtml += "<a href='" + bug.val().image + "'>Link to screenshot</a>";
                        bugsHtml += "<br>";
                        bugsHtml += "<p>Created by " + bug.val().name + " at " + bug.val().time + "</p>";
                        bugsHtml += "<div class='row text-center d-flex justify-content-around'>"
                            bugsHtml += "<button type='submit' onclick=inProgress('";
                            bugsHtml += bug.key;
                            bugsHtml += "') class='col-md-3 btn btn-primary px-0 m-1' id='btn-status-update'>In progress</button>";
                    
                            bugsHtml += "<button type='submit' onclick=review('";
                            bugsHtml += bug.key;
                            bugsHtml += "') class='col-md-3 btn btn-warning  px-0 m-1' id='btn-status-update'>Review</button>";
                    
                            bugsHtml += "<button type='submit' onclick=closed('";
                            bugsHtml += bug.key;
                            bugsHtml += "') class='col-md-3 btn btn-success  px-0 m-1' id='btn-status-update'>Closed</button>";
                        bugsHtml += "</div>"
                    bugsHtml += "</div>";
        });
        $('#recentBugs').html(bugsHtml);
    }
})
};

showAllBugs();

//Filter by status

let statusFilter = $("#statusSelect").val();
$("#filterStatus").click(() => {
    filterByStatus(statusFilter);
});



const filterByStatus = status => {
    dbBugs.on("value", function(bugs){
    if (bugs.exists()) {
        var bugsHtml = "";
        bugs.forEach(function(bug){
            if (status == bug.val().status) { 
                    bugsHtml += "<div class='col-md-5 bg-white m-3 p-3 d-flex flex-column justify-content-between'>";
                        bugsHtml += "<div class='text-center text-dark'><h4>";
                            bugsHtml += bug.val().bugTitle;
                        bugsHtml += "</h4></div>";
                        bugsHtml += "<p class='text-center'> Status: " + bug.val().status + "</p>";
                        bugsHtml += "<br>";
                        bugsHtml += "<div class='d-none' id='bugKey'>";
                            bugsHtml += bug.key;
                        bugsHtml += "</div>";
                        bugsHtml += "<div class='text-dark'>";
                            bugsHtml += bug.val().description;
                        bugsHtml += "</div>";
                        bugsHtml += "<br>";
                        bugsHtml += "<a href='" + bug.val().image + "'>Link to screenshot</a>";
                        bugsHtml += "<br>";
                        bugsHtml += "<p>Created by " + bug.val().name + " at " + bug.val().time + "</p>";
                        bugsHtml += "<div class='row text-center d-flex justify-content-around'>"
                            bugsHtml += "<button type='submit' onclick=inProgress('";
                            bugsHtml += bug.key;
                            bugsHtml += "') class='col-md-3 btn btn-primary px-0 m-1' id='btn-status-update'>In progress</button>";
                    
                            bugsHtml += "<button type='submit' onclick=review('";
                            bugsHtml += bug.key;
                            bugsHtml += "') class='col-md-3 btn btn-warning  px-0 m-1' id='btn-status-update'>Review</button>";
                    
                            bugsHtml += "<button type='submit' onclick=closed('";
                            bugsHtml += bug.key;
                            bugsHtml += "') class='col-md-3 btn btn-success  px-0 m-1' id='btn-status-update'>Closed</button>";
                        bugsHtml += "</div>"
                    bugsHtml += "</div>";
                }
        });
        $('#recentBugs').html(bugsHtml);
    };
    });
    console.log("filterByStatus a mers coae")
}


//*********** End of Bug Retrieve and Display **************


/*************** Bug Status Update ****************/



// const updatedStatus = $("#updatedStatus").val();
// $("#btn-status-update").click(function() {
//     firebase.database().ref('Bugs/' + )
// })

function inProgress(key) {
    firebase.database().ref("Bugs/" + key).update({"status":"In Progress"})
};

function review(key) {
    firebase.database().ref("Bugs/" + key).update({"status":"Review"})
};

function closed(key) {
    firebase.database().ref("Bugs/" + key).update({"status":"Closed"})
};








