var $ = require("./jquery/dist/jquery.min.js");

$(document).ready(function() {    
    $('#session_init_button').bind('click', function () {
    	var serverUrl = $("#session_url").val();
    	var ret = '';

		$.when($.ajax({url: "/initLibrary?url=" + serverUrl, 
			success: function(result){
		        ret = result;
		    }
		})).then( function() {
			/*$("#url_fixed").empty();
			if (ret == "Login Successful") {
				$("#url_fixed").append("<br><b>Session URL : </b>" + serverUrl);
			}
			else {
				$("#url_fixed").append("<br>Attempt <b>un-succesful!</b>");	
			}*/
		});
	});

	$('#login_button').bind('click', function () {
		var uname = $("#uname").val();
		var pass = $("#pass").val();
		var ret = '';

		$.when($.ajax({url: "/login?user=" + uname + "&pass=" + pass, 
			success: function(result){
		        ret = result;
	    	}
	    })).then(function() {
			/*$("#status").empty();
			if (ret == true || ret == "true") {
				$("#status").append("<br>Log in attempt <b>succesful!</b>");
			}
			else {
				$("#status").append("<br>Log in attempt <b>un-succesful!</b>");	
			}*/
		});
	});

	$('#login_button_create').bind('click', function () {
		var uname = $("#uname_create").val();
		var pass = $("#pass_create").val();
		var ret = '';

		$.when($.ajax({url: "/createUser?user=" + uname + "&pass=" + pass, 
			success: function(result){
		        ret = result;
	    	}
	    })).then(function() {
			/*$("#status").empty();
			if (ret == true || ret == "true") {
				$("#status").append("<br>Log in attempt <b>succesful!</b>");
			}
			else {
				$("#status").append("<br>Log in attempt <b>un-succesful!</b>");	
			}*/
		});
	});
});