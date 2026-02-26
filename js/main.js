/*---------------------------------------------------------------------------------
/*
/* Main JS
/*
-----------------------------------------------------------------------------------*/

(function ($) {
  "use strict";

  /*---------------------------------------------------- */
  /* Preloader
	------------------------------------------------------ */
  $(window).load(function () {
    // will first fade out the loading animation
    $("#loader").fadeOut("slow", function () {
      // will fade out the whole DIV that covers the website.
      $("#preloader").delay(300).fadeOut("slow");
    });
  });

  /*----------------------------------------------------*/
  /* Adjust Primary Navigation Background Opacity
	------------------------------------------------------*/
  $(window).on("scroll", function () {
    var h = $("header").height();
    var y = $(window).scrollTop();
    var header = $("#main-header");

    if (y > h + 30 && $(window).outerWidth() > 768) {
      header.addClass("opaque");
    } else {
      if (y < h + 30) {
        header.removeClass("opaque");
      } else {
        header.addClass("opaque");
      }
    }
  });

  /*----------------------------------------------------*/
  /* FitText Settings
  	------------------------------------------------------ */
  setTimeout(function () {
    $("#hero-slider h1").fitText(1, {
      minFontSize: "30px",
      maxFontSize: "49px",
    });
  }, 100);

  /*-----------------------------------------------------*/
  /* Mobile Menu
   ------------------------------------------------------ */
  var menu_icon = $("<span class='menu-icon'>Menu</span>");
  var toggle_button = $("<a>", {
    id: "toggle-btn",
    html: "",
    title: "Menu",
    href: "#",
  });
  var nav_wrap = $("nav#nav-wrap");
  var nav = $("ul#nav");

  /* if JS is enabled, remove the two a.mobile-btns 
  	and dynamically prepend a.toggle-btn to #nav-wrap */
  nav_wrap.find("a.mobile-btn").remove();
  toggle_button.append(menu_icon);
  nav_wrap.prepend(toggle_button);

  toggle_button.on("click", function (e) {
    e.preventDefault();
    nav.slideToggle("fast");
  });

  if (toggle_button.is(":visible")) nav.addClass("mobile");
  $(window).resize(function () {
    if (toggle_button.is(":visible")) nav.addClass("mobile");
    else nav.removeClass("mobile");
  });

  $("ul#nav li a").on("click", function () {
    if (nav.hasClass("mobile")) {
      // If this is a dropdown top-level link, toggle the sub-menu instead of closing nav
      var $parent = $(this).parent();
      if ($parent.hasClass("dropdown") || $parent.hasClass("dropdown-current")) {
        if ($(this).hasClass("top-level")) {
          $parent.toggleClass("open");
          $parent.children(".dropdown-content").slideToggle(300);
          return false;
        }
      }
      nav.fadeOut("fast");
    }
  });

  /*----------------------------------------------------*/
  /*	Modal Popup
	------------------------------------------------------*/
  $(".item-wrap a").magnificPopup({
    type: "inline",
    fixedContentPos: false,
    removalDelay: 300,
    showCloseBtn: false,
    mainClass: "mfp-fade",
  });

  $(document).on("click", ".popup-modal-dismiss", function (e) {
    e.preventDefault();
    $.magnificPopup.close();
  });
})(jQuery);
