<?php
/**
 * @package Cashemir - Responsive One Page Joomla Template
 * @author Cththemes - www.cththemes.com
 * @date: 29-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */

defined('_JEXEC') or die;

// Getting params from template
$params = &JFactory::getApplication()->getTemplate(true)->params;

$app = JFactory::getApplication();
$doc = JFactory::getDocument();
$title = $doc->getTitle();
$this->language = $doc->language;

$pageType = "onePage";
$hideComponentErea = '0';
$pageColor = $params->get('preMadeSkin','default');
$skin = $params->get('skin','team');

$active = JFactory::getApplication()->getMenu()->getActive();
if(isset($active)){
	if($active->params->get('menuItemStyle')){
		$pageType = $active->params->get('menuItemStyle');
	}
	if($active->params->get('hideComponentErea')){
		$hideComponentErea = $active->params->get('hideComponentErea');
	}
	if($active->params->get('pageColor')){
		$pageColor = $active->params->get('pageColor');
	}
	if($active->params->get('templateLayout')){
		$skin = $active->params->get('templateLayout');
	}
}

switch ($skin) {
	case 'team':
		$js_folder = 'js';
		$css_folder = 'css';
		break;
	case 'personal':
		$js_folder = 'js-personal';
		$css_folder = 'css-personal';
		break;
	case 'sticky':
		$js_folder = 'js-sticky';
		$css_folder = 'css-sticky';
		break;
	default :
		$js_folder = 'js';
		$css_folder = 'css';
		break;
}

$params->set('pageType',$pageType);

$input = $app->input;

// unset($doc->_scripts[JURI::root(true)."/media/system/js/mootools-core.js"]);
// unset($doc->_scripts[JURI::root(true)."/media/system/js/core.js"]);
// unset($doc->_scripts[JURI::root(true)."/media/system/js/mootools-more.js"]);
// unset($doc->_scripts[JURI::root(true)."/media/jui/js/jquery.min.js"]);
unset($doc->_scripts[JURI::root(true)."/media/jui/js/jquery-noconflict.js"]);
// unset($doc->_scripts[JURI::root(true)."/media/jui/js/jquery-migrate.min.js"]);
// unset($doc->_scripts[JURI::root(true)."/components/com_k2/js/k2.js?v2.6.7&amp;sitepath=".JURI::base(true)."/"]);
$option   = $app->input->getCmd('option', '');
$view     = $app->input->getCmd('view', '');
$layout   = $app->input->getCmd('layout', '');
$task     = $app->input->getCmd('task', '');
$itemid   = $app->input->getCmd('Itemid', '');
$sitename = $app->getCfg('sitename');

// Adjusting content width
if (($this->countModules('left-sidebar')|| $this->countModules('position-8')) && ($this->countModules('right-sidebar')|| $this->countModules('position-7')))
{
	$col = "grid-2";
}
elseif (($this->countModules('left-sidebar')|| $this->countModules('position-8')) && !$this->countModules('right-sidebar') && !$this->countModules('position-7'))
{
	$col = "grid-4";
}
elseif (!$this->countModules('left-sidebar') && !$this->countModules('position-8') && ($this->countModules('right-sidebar')|| $this->countModules('position-7')))
{
	$col = "grid-4";
}
else
{
	$col = "grid-full";
}

$favicon = $params->get('favicon');
$logoImage = $params->get('logoImage');
$logoText = $params->get('logoText');
$logo = '';
if(!empty($logoImage)){
	$logo .= '<img src="'.JURI::base(true).'/'.$logoImage.'" class="logo" title="'.$sitename.'" alt="'.$sitename.'">';
}elseif(!empty($logoText)){
	$logo .= '<h1><a href="index.php#intro"'.(($pageType == 'onePage')? ' class="scroll-link"': '').'>'.$logoText.'</a></h1>';
}elseif(empty($logo)){
	$logo .= '<h1><a href="index.php#intro"'.(($pageType == 'onePage')? ' class="scroll-link"': '').'>'.$sitename.'</a></h1>';
}

				

$overrideColor = $params->get('overrideColor','0');
$sC = substr($params->get('colorSkin', '#ff4800'),1);
?>

<!DOCTYPE html>
<html lang="<?php echo $this->language;?>">
<!--[if IE 7]><html lang="en" class="ie7"><![endif]-->
<!--[if IE 8]><html lang="en" class="ie8"><![endif]-->
<!--[if IE 9]><html lang="en" class="ie9"><![endif]-->
<!--[if (gt IE 9)|!(IE)]><html lang="en"><![endif]-->
<!--[if !IE]><html lang="en"><![endif]-->
<head>
	<meta charset="<?php echo $this->_charset;?>">
	
	
	<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
	
	<jdoc:include type="head" />

	<!-- Standard Favicon--> 
	<link rel="shortcut icon" href="<?php echo JURI::base(true). (!empty($favicon)? '/'.$favicon : '/images/favicon/favicon.ico');?>">
	
	<!-- joomla default style -->
	<link rel="stylesheet" href="<?php echo JURI::base(true).'/templates/'.$this->template; ?>/css/jldefault-style.css">

	<!--=============== css  ===============-->	
    <link rel="stylesheet" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/font-awesome.min.css">
	<link rel="stylesheet" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/normalize.css" type="text/css" media="screen">
	<link rel="stylesheet" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/grid.css" type="text/css" media="screen">
	<link rel="stylesheet" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/owl.carousel.css" type="text/css" media="screen">
	<link rel="stylesheet" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/flexslider.css" type="text/css" media="screen">
	<link rel="stylesheet" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/magnific-popup.css" media="all">
	<link rel="stylesheet" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/superslides.css" type="text/css" media="screen">
	<link rel="stylesheet" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/style.css" type="text/css" media="screen">
	
	<link rel="stylesheet" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/panel.css" type="text/css" media="screen">

	
	<!--=============== fonts  ===============-->

	<link href='http://fonts.googleapis.com/css?family=Oswald:400,700|Open+Sans:400,300' rel='stylesheet' type='text/css'>

	<?php if($overrideColor != '1') : 
		switch ($pageColor) {
			case 'blue': ?>
		<link rel="stylesheet" type="text/css" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/blue-style.css" media="screen" />
		<?php
				break;
			case 'green': ?>
		<link rel="stylesheet" type="text/css" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/green-style.css" media="screen" />
		<?php
				break;
			case 'yellow': ?>
		<link rel="stylesheet" type="text/css" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/yellow-style.css" media="screen" />
		<?php
				break;
			case 'orange': ?>
		<link rel="stylesheet" type="text/css" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/orange-style.css" media="screen" />
		<?php
				break;
		}

	?>

	<?php endif;?>

	<?php if($overrideColor == '1') : ?>
	<link rel="stylesheet/less" type="text/css" media="screen" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/color.php?sc=<?php echo $sC;?>">
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template; ?>/js/less.js"></script>
	
	<?php endif;?>

	<script type="text/javascript" >
		baseUrl = '<?php echo JURI::base(true);?>';
		siteName = '<?php echo $sitename;?>';
	</script>

	<link rel="stylesheet" href="<?php echo JURI::base(true).'/templates/'.$this->template; ?>/css/custom.css" type="text/css" media="screen">

	<!--=============== modernizr  ===============-->

	<script src="<?php echo JURI::base(true).'/templates/'.$this->template; ?>/js/modernizr.custom.97074.js"></script>
	
	<!--=============== ie styles  ===============-->

	<!--[if IE 8]><link rel="stylesheet" type="text/css" href="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$css_folder; ?>/ie8.css" /><![endif]-->
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/jquery.min.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/jpreloader.min.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/smoothscroll.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/jquery.easing.1.3.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/superslides.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/mixitup.js"></script>
	<script type="text/javascript" defer src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/jquery.flexslider.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/jquery.parallax-1.1.3.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/jquery.scrollTo-1.4.2-min.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/hoverdir.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/owl.carousel.min.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/appear.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/jquery.nav.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/fitvids.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/jquery.lavalamp.min.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/jquery.hammer.min.js"></script>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/jquery.magnific-popup.min.js"></script>
	<?php if($skin == 'sticky') :?>
	<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/jquery.sticky.js"></script>
	<?php endif;?>
</head>


<body>
	
	<div id="main">
		


	<?php if ($this->countModules('navigation') || $this->countModules('social-list')) : ?>

	<!--=============== navigation ===============-->

	<div class="navigation isDown">
	
		<div class="nav-overlay"></div>
		
		<div class="nav-button transition">
			<span></span>
			<span></span>
			<span></span>
		</div>
		
		<div class="inner">
			<?php echo $logo;?>
			
			<div class="link-holder" id="nav">
				<jdoc:include type="modules" name="navigation" style="none" />
			</div>
			
		</div>
	
		<div class="social-list">
			
			<jdoc:include type="modules" name="social-list" style="none" />
						
		</div>	
			 
	</div>	<!--=============== navigation end ===============-->

	<?php endif;?>
	<div class="overlay fixed-overlay body-overlay"></div>	
	<div class="wrapper">

	<?php if ($this->countModules('sticky-menu') ) : ?>

	<div class="sections">
	<!--=============== navigation ===============-->
	
		<div class="navigation isDown">
		
			
			<div class="nav-button transition">
				<span></span>
				<span></span>
				<span></span>
			</div>
			
			<div class="inner">
				<?php echo $logo;?>
				
				<div class="link-holder" id="nav">
					<jdoc:include type="modules" name="sticky-menu" style="none" />
				</div>
				
			</div>
		
				 
		</div><!--=============== navigation end ===============-->	
	
	</div>

	<?php endif;?>

	

	<?php if($this->countModules('breadcrumbs')) : ?>
		<!-- Breadcrumbs -->
		<jdoc:include type="modules" name="breadcrumbs"  style="none" />
	<?php endif;?>

	

	<?php if ($this->countModules('position-4')) : ?>
  		<jdoc:include type="modules" name="position-4" style="none" />
	<?php endif;?>

	<?php if ($this->countModules('position-5')) : ?>
  		<jdoc:include type="modules" name="position-5" style="none" />
	<?php endif;?>

	<?php if ($this->countModules('position-6')) : ?>
  		<jdoc:include type="modules" name="position-6" style="none" />
	<?php endif;?>
	

	<?php if($hideComponentErea !=='1') : ?>
	<!-- Component erea -->
	<?php if($this->countModules('left-sidebar') || $this->countModules('position-8') || $this->countModules('right-sidebar') || $this->countModules('position-7')) : ?>
	<div class="sections ws simple-page">
		<div class="content">
			<?php
				$blogHeaderIcon = $params->get('blogHeaderIcon','');

			if(!empty($blogHeaderIcon)) : ?>

			<div class="quote-icon"><i class="<?php echo $blogHeaderIcon ;?>"></i></div>

			<?php endif;?>
			<div class="container">

			<!-- Left Sidebar -->
			<?php if($this->countModules('left-sidebar') || $this->countModules('position-8')) : ?>
				
				<div class="grid-2">
					<div class="sidebar">
					<?php if($this->countModules('left-sidebar')) :?>
						<jdoc:include type="modules" name="left-sidebar"  style="widget" />
					<?php endif;?>
					<?php if($this->countModules('left-sidebar')) :?>
						<jdoc:include type="modules" name="position-8" style="xhtml" />
					<?php endif;?>
					</div>
				</div>
			<?php endif;?>
			<!-- End Left Sidebar -->
				<!-- Post area -->
				<div class="<?php echo $col;?>">
		<?php endif;?>
				<?php if ($this->countModules('position-1')) : ?>
			  		<jdoc:include type="modules" name="position-1" style="none" />
				<?php endif;?>
				<?php if ($this->countModules('position-2')) : ?>
			  		<jdoc:include type="modules" name="position-2" style="none" />
				<?php endif;?>
				<jdoc:include type="modules" name="position-3" style="xhtml" />
				<jdoc:include type="message" />
				<jdoc:include type="component" />

		<?php if($this->countModules('left-sidebar') || $this->countModules('position-8') || $this->countModules('right-sidebar') || $this->countModules('position-7')) : ?>	
				</div>

			<!-- Right Sidebar -->
			<?php if($this->countModules('right-sidebar') || $this->countModules('position-7')) : ?>
				
				<div class="grid-2">
					<div class="sidebar">
					<?php if($this->countModules('right-sidebar')) :?>
						<jdoc:include type="modules" name="right-sidebar"  style="widget" />
					<?php endif;?>
					<?php if($this->countModules('position-7')) :?>
						<jdoc:include type="modules" name="position-7" style="well" />
					<?php endif;?>
						
					</div>
				</div>
			<?php endif;?>
			<!-- End Right Sidebar -->

			</div>
		</div>
		<!-- End .content -->
	</div>
	<?php endif;?>
	<?php endif;?>


	<?php if ($this->countModules('position-9')) : ?>
  		<jdoc:include type="modules" name="position-9" style="none" />
	<?php endif;?>

	<?php if ($this->countModules('footer')) : ?>
  		<jdoc:include type="modules" name="footer" style="footer" />
	<?php endif;?>

	
	<?php if ($this->countModules('footer-contactform') || $this->countModules('footer-contactdetails') || $this->countModules('footer-gmap') || $this->countModules('footer-copyright')) : ?>
	<!--=============== section contacts ===============-->

	<div id="contacts" class="sections">
		<div class="content">
			<div class="quote-icon to-top"><i class="fa fa-angle-up"></i></div>
			<div class="container">
			
				<!--contact form -->
									
				<?php if ($this->countModules('footer-contactform')) : ?>
			  		<jdoc:include type="modules" name="footer-contactform" style="none" />
				<?php endif;?>
			
				<?php if ($this->countModules('footer-contactdetails')) : ?>
			  		<jdoc:include type="modules" name="footer-contactdetails" style="none" />
				<?php endif;?>					
				
			</div>
			
			<!--map-->
			<?php if ($this->countModules('footer-gmap')) : ?>
		  		<jdoc:include type="modules" name="footer-gmap" style="none" />
			<?php endif;?>
				
			<!--footer end-->

			<?php if ($this->countModules('footer-copyright')) : ?>
		  		<jdoc:include type="modules" name="footer-copyright" style="none" />
			<?php endif;?>
		 	<!--footer end-->
			
		</div>
	</div><!--=============== section contacts end ===============-->

	<?php endif;?>

	<?php if ($this->countModules('debug')) : ?>
  		<jdoc:include type="modules" name="debug" style="none" />
	<?php endif;?>

	</div>
	<!-- /.wrapper -->
	</div>
	<!-- /#main -->

	<!-- =============== javascript =============== -->

	<script>
		// JpreLoader ------------------
		jQuery('#main').jpreLoader({
			loaderVPos: '50%',
			autoClose: true,
		}, 
		function() {	
			jQuery('#main').animate({"opacity":'1'},{queue:false,duration:700,easing:"easeInOutQuad"});
			// setTimeout( function(){		
			// 	jQuery('.panel').slideUp(1000);
			// },1200);
		});
	</script>
<script type="text/javascript" src="<?php echo JURI::base(true).'/templates/'.$this->template.'/'.$js_folder; ?>/scripts.js"></script>
<a href="https://api.whatsapp.com/send?l=pt&amp;phone=5512974052176"><img src="http://nfsolucoesdigitais.com.br/nfs/images/whatsapp.png" style="height:80px; position:fixed; bottom: 25px; left: 25px; z-index:100;" data-selector="img"></a>

</body>
</html>
