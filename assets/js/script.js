$(document).ready(function(){
  // Mostrar cadastro
  $("#showRegister").click(function(e){
    e.preventDefault();
    $("section").removeClass("active");
    $("#registerForm").addClass("active");
  });

  // Mostrar esqueci senha
  $("#showForgot").click(function(e){
    e.preventDefault();
    $("section").removeClass("active");
    $("#forgotForm").addClass("active");
  });

  // Voltar para login
  $("#backToLogin1, #backToLogin2").click(function(e){
    e.preventDefault();
    $("section").removeClass("active");
    $("#loginForm").addClass("active");
  });
});
