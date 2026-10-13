
$(document).ready(function(){
    
    $(".pts_menu").each(function(){
        var url = document.URL;
        //alert('test dfgd');
        $(".pts_menu .parentMenu a").removeClass("act");
        $('.pts_menu .parentMenu a[href="'+url+'"]').addClass('act');
    }); 
    
    $('.pts_menu_no_child').hover(function(){
        $(this).addClass("active");
    },function(){
        $(this).removeClass("active");
    })
    
    $('.pts_menu').hover(function(){
        if($(this).attr("id") != "pts_menu_link"){
            $(this).addClass("active");
        }
    },function(){
        $(this).removeClass("active");
    })
    
    $('.pts_menu').hover(function(){
       /*show popup to calculate*/
       $(this).find('.popup').css('display','inline-block');
       
       /* get total padding + border + margin of the popup */
       var extraWidth       = 0
       var wrapWidthPopup   = $(this).find('.popup').outerWidth(true); /*include padding + margin + border*/
       var actualWidthPopup = $(this).find('.popup').width(); /*no padding, margin, border*/
       extraWidth           = wrapWidthPopup - actualWidthPopup;    
       
       /* calculate new width of the popup*/
       var widthblock1 = $(this).find('.popup .block1').outerWidth(true);
       var widthblock2 = $(this).find('.popup .block2').outerWidth(true);
       var new_width_popup = 0;
       if(widthblock1 && !widthblock2){
           new_width_popup = widthblock1;
       }
       if(!widthblock1 && widthblock2){
           new_width_popup = widthblock2;
       }
       if(widthblock1 && widthblock2){
            if(widthblock1 >= widthblock2){
                new_width_popup = widthblock1;
            }
            if(widthblock1 < widthblock2){
                new_width_popup = widthblock2;
            }
       }
       var new_outer_width_popup = new_width_popup + extraWidth;
       
       /*define top and left of the popup*/
       var wraper = $('.pts_megamenu');
       var wWraper = wraper.outerWidth();
       var posWraper = wraper.offset();
       var pos = $(this).offset();
       var width_element = $(this).outerWidth()
       var xTop = pos.top - posWraper.top + CUSTOMMENU_POPUP_TOP_OFFSET;
       if (LANG_RTL == 1)
           var xRight = wWraper - (pos.left + width_element) + posWraper.left;
       else 
           var xLeft = pos.left - posWraper.left;
       if ((xRight + new_outer_width_popup) > wWraper) xRight = wWraper - new_outer_width_popup;
       if ((xLeft + new_outer_width_popup) > wWraper) xLeft = wWraper - new_outer_width_popup;
       $(this).find('.popup').css('top',xTop);
       if (LANG_RTL == 1)
            $(this).find('.popup').css('right',xRight);
       else
            $(this).find('.popup').css('left',xLeft);
       
       /*set new width popup*/
       $(this).find('.popup').css('width',new_outer_width_popup);
       $(this).find('.popup .block1').css('width',new_width_popup);
       
       /*return popup display none*/
       $(this).find('.popup').css('display','none');
       
       /*show hide popup*/
       if(CUSTOMMENU_POPUP_EFFECT == 0) $(this).find('.popup').stop(true,true).slideDown('slow');
       if(CUSTOMMENU_POPUP_EFFECT == 1) $(this).find('.popup').stop(true,true).fadeIn('slow');
       if(CUSTOMMENU_POPUP_EFFECT == 2) $(this).find('.popup').stop(true,true).show('slow');
    },function(){
       if(CUSTOMMENU_POPUP_EFFECT == 0) $(this).find('.popup').stop(true,true).slideUp();
       if(CUSTOMMENU_POPUP_EFFECT == 1) $(this).find('.popup').stop(true,true).fadeOut('slow');
       if(CUSTOMMENU_POPUP_EFFECT == 2) $(this).find('.popup').stop(true,true).hide('fast');
    })
    
   $( ".popup" ).hover(
  function() {
    $( this ).show();
  }, function() {
    $( this ).hide();
  }
);
$(function(){
    $(window).scroll(function () {
        if ($(this).scrollTop() >= 160) {
                $('#sticky_top').addClass('sticky-fixed-top');
                $('#sticky_top').addClass('ac_results_sticky');
                $('.ac_results').slideUp();
                if(LANG_RTL != 1)
                    $('#sticky_top').css({
                      'right': ($('body').outerWidth() - $('.container').outerWidth())/2
                    });
                else
                    $('#sticky_top').css({
                      'right': 'auto',  
                      'left': ($('body').outerWidth() - $('.container').outerWidth())/2
                    });
                $('.top-menu').addClass('navbar-fixed-top');
                $('.top-menu').css({
                  'position':'fixed',
                  'z-index':'1030',
                  'top':'0'
                });
        }
        if ($(this).scrollTop() < 160) {
                $('#sticky_top').removeClass('sticky-fixed-top');
                $('#sticky_top').removeClass('ac_results_sticky');
                $('.top-menu').removeClass('navbar-fixed-top');
                $('.top-menu').css({
                    'position':'relative',
                    'z-index':'1030'
                });
        }
    });
});
	//background color 
                    $('<style type="text/css"> #blockptsblogstabs .blog_container a.see-more, .top-menu, .left-block .button-container a span.wrap_bg, .left-block .button-container a:first-child span.wrap_bg, .left-block .button-container:hover a:first-child span.wrap_bg, ul.tab_cates li, .tags_block .block_content a, .tags_block .block_content a:hover, #footer .block_content .btn, .footer-container .footer-top #social_block ul li, #footer .footer-center, .cart_block .cart-buttons a#button_order_cart span, .cart_block .cart-buttons a#button_order_cart:hover span, .pts_megamenu div.popup div.menu-bottom a, #pts_megamenu .pts_menu .parentMenu a:hover span.safe-off, #pts_megamenu .pts_menu.active .parentMenu a span.safe-off, #pts_megamenu .pts_menu.act .parentMenu a span.safe-off, .top-pagination-content ul.pagination li > a span, .top-pagination-content ul.pagination li > span span, .bottom-pagination-content ul.pagination li > a span, .bottom-pagination-content ul.pagination li > span span, .top-pagination-content ul.pagination li > a:hover span,.bottom-pagination-content ul.pagination li > a:hover span, .content_sortPagiBar .display li.selected i, .content_sortPagiBar .display_m li.selected i, .button.button-medium.bt_compare, #wishlist_block a.btn, .home-banner .img2 span.ontop, .home-banner .img6 span.ontop, #search_block_top .btn.button-search, #languages_block_top ul#first-languages li, #currencies_block_top ul#first-currencies li, .box-info-product .exclusive, .idTabs a, .button.button-small, .button.button-medium, .button.button-medium.exclusive, #layer_cart .layer_cart_cart .button-container .btn, .box-info-product .exclusive, .simpleblog-single.with-cover .cover .info h1 .blog-post-likes, #pts-mobilemenu, .button.ajax_add_to_cart_button span, .button.lnk_view span, .cart_navigation .button-exclusive { background-color:#'+COLOR1+'}</style>').appendTo('head');
                    $('<style type="text/css"> #pts_megamenu .pts_menu .parentMenu a:hover span.safe-off:before, #pts_megamenu .pts_menu.active .parentMenu a span.safe-off:before, #pts_megamenu .pts_menu.act .parentMenu a span.safe-off:before { color:#'+COLOR1+'}</style>').appendTo('head');
                    $('<style type="text/css"> @media only screen and (max-width: 1200px) { .shopping_cart > a:first-child { background-color:#'+COLOR1+' !important }}</style>').appendTo('head');
                    $('<style type="text/css"> .back-top a:hover { background-color:#'+COLOR1+' !important}</style>').appendTo('head');
        //hover color
                    $('<style type="text/css"> .pts_megamenu div.pts_menu .parentMenu a:hover, .pts_megamenu div.pts_menu .parentMenu span.block-title:hover, .pts_megamenu .pts_menu .parentMenu a.act, .pts_megamenu .pts_menu.act .parentMenu a, .pts_megamenu .pts_menu.active .parentMenu a, .pts_megamenu div.popup div.menu-bottom a:hover, ul.tab_cates li.active, ul.tab_cates li:hover, .tags_block .block_content a:hover, #blockptsblogstabs .blog_container a.see-more:hover, #footer .block_content .btn:hover, .shopping_cart > a:first-child:hover, .cart_block .cart-buttons a#button_order_cart:hover span, #pts_megamenu .pts_menu .parentMenu span.safe-off, .back-top a, .top-pagination-content ul.pagination li.active > span span, .bottom-pagination-content ul.pagination li.active > span span, .back-top a:hover, .top-pagination-content ul.pagination li > a span, .top-pagination-content ul.pagination li > span span, .bottom-pagination-content ul.pagination li > a span, .bottom-pagination-content ul.pagination li > span span, .top-pagination-content ul.pagination li > a:hover span,.bottom-pagination-content ul.pagination li > a:hover span, .content_sortPagiBar .display li a:hover i, .content_sortPagiBar .display_m li a:hover i,  .button.button-medium.bt_compare:hover, #wishlist_block a.btn:hover, ul.product_list.list > li .product-container .center-block .button-container a:hover, .tp-caption a.shop-now:hover, .tp-caption a.shop-now2:hover, .tp-caption a.shop-now3:hover, .home-banner .img2, .home-banner .img6, .static-bottom a, #search_block_top .btn.button-search:hover, #languages_block_top ul#first-languages li:hover, #currencies_block_top ul#first-currencies li:hover, .box-info-product .exclusive:hover, #product #more_info_tabs li a.selected, .idTabs a:hover, .button.ajax_add_to_cart_button span:hover, .button.lnk_view span:hover, .button.button-small:hover, .cart_navigation .button-exclusive:hover, .button.button-medium:hover, .simpleblog-single.with-cover .cover .info h1 .blog-post-likes:hover, .button.button-medium.exclusive:hover, #layer_cart .layer_cart_cart .button-container .btn:hover, .box-info-product .exclusive:hover { background-color:#'+ COLOR2 +'}</style>').appendTo('head');
                    $('<style type="text/css"> .left-block .button-container a:hover span.wrap_bg { background-color:#'+COLOR2+' !important}</style>').appendTo('head');
                    $('<style type="text/css"> #pts_megamenu .pts_menu .parentMenu span.safe-off:before, .pagination > li:last-child > a, .pagination > li:last-child > span, #my-account ul.myaccount-link-list li a i, #footer .footer-center .myaccount li a:hover, #footer .footer-center #block_various_links_footer li a:hover, #footer .footer-center .why-buy li a:hover { color:#'+COLOR2+'}</style>').appendTo('head');
                    $('<style type="text/css"> @media only screen and (max-width: 1200px) { .shopping_cart > a:first-child:hover { background-color:#'+COLOR2+' !important }}</style>').appendTo('head');
                    $('<style type="text/css"> .tp-caption a.shop-now:hover, .tp-caption a.shop-now2:hover, .tp-caption a.shop-now3:hover { border-color:#'+COLOR2+'}</style>').appendTo('head');
});