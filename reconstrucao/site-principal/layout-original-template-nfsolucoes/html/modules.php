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
/*
 * Module chrome for rendering the module in a submenu
 */


function modChrome_container($module,&$params, &$attribs){
	if($module->content){
		echo "<div class=\"cth-container " . htmlspecialchars($params->get('moduleclass_sfx')) . "\">";
			echo "<div class=\"container\">";
				if ($module->showtitle)
				{
					echo "<h5>" . $module->title . "</h5>";
				}
				echo $module->content;
			echo "</div>";
		echo "</div>";
	}
}

function modChrome_sidebarhr($module,&$params, &$attribs){
	if($module->content){
		echo "<div class=\"cth-sidebar " . htmlspecialchars($params->get('moduleclass_sfx')) . "\">";
		if ($module->showtitle)
		{
			echo "<" . htmlspecialchars($params->get('header_tag')) . " class=\"sidebar-heading ". htmlspecialchars($params->get('header_class')) . "\">" . $module->title . "</" . htmlspecialchars($params->get('header_tag')) . ">";
		}
		echo $module->content;
		echo "</div>";
		echo "<hr>";
	}
}

function modChrome_sidebar($module,&$params, &$attribs){
	if($module->content){
		echo "<div class=\"cth-sidebar " . htmlspecialchars($params->get('moduleclass_sfx')) . "\">";
		if ($module->showtitle)
		{
			echo "<" . htmlspecialchars($params->get('header_tag')) . " class=\"sidebar-heading ". htmlspecialchars($params->get('header_class')) . "\">" . $module->title . "</" . htmlspecialchars($params->get('header_tag')) . ">";
		}
		echo $module->content;
		echo "</div>";
	}
}

function modChrome_shortcodes($module,&$params, &$attribs){
	if($module->content){
		echo'<div class="container '. htmlspecialchars($params->get('moduleclass_sfx')) .'">';
		if ($module->showtitle)
		{
			echo'<div class="elements-heading">';
				echo'<h3>'.$module->title.'</h3>';
				echo'<hr style="margin: 10px 0 20px;">';
			echo'</div>';
		}
		echo $module->content;
		echo "</div>";
	}
}

function modChrome_well($module, &$params, &$attribs)
{
	if ($module->content)
	{
		echo "<div class=\"well " . htmlspecialchars($params->get('moduleclass_sfx')) . "\">";
		if ($module->showtitle)
		{
			echo "<h3 class=\"page-header\">" . $module->title . "</h3>";
		}
		echo $module->content;
		echo "</div>";
	}
}








function modChrome_widget($module, &$params, &$attribs)
{
	if ($module->content)
	{
		echo "<div class=\"widget " . htmlspecialchars($params->get('moduleclass_sfx')) . "\">";
		if ($module->showtitle)
		{
			echo "<h4>" . $module->title . "</h4>";
		}
		echo $module->content;
		echo "</div>";
	}
}

function modChrome_section($module, &$params, &$attribs){
	if($module->content){
		$cthmoduleid_sfx = $params->get('cthmoduleid_sfx');
		$cthmoduleclass_sfx = htmlspecialchars($params->get('cthmoduleclass_sfx'));
		echo '<section '.(!empty($cthmoduleid_sfx)? ' id="'.$cthmoduleid_sfx.'"' : '').' '.(!empty($cthmoduleclass_sfx)? ' class="'.$cthmoduleclass_sfx.'"' : '').'>';

			if ($module->showtitle)
			{
				echo '<!-- Title -->';
				echo '<div class="row title '.htmlspecialchars($params->get('header_class')).'">';
					echo '<h2>'. $module->title .'</h2>';
					echo '<hr>';
				echo '</div>';

			}

			echo $module->content;

		echo '</section>';

	}
}

function modChrome_footer($module, &$params, &$attribs)
{
	if ($module->content)
	{
		echo "<footer class=\"cth-footer " . htmlspecialchars($params->get('moduleclass_sfx')) . "\">";
		if ($module->showtitle)
		{
			echo "<h3>" . $module->title . "</h3>";
		}
		echo $module->content;
		echo "</footer>";
	}
}

function modChrome_promo($module, &$params, &$attribs)
{
	if ($module->content)
	{
		echo'<!-- Hidden promo control -->';
		echo'<div class="promo-control"><a>'.$module->title.'</a></div>';


		echo'<!-- Hidden promo -->';
		echo'<section class="footer-promo">';
			echo'<div class="row">';
				echo'<div class="eight col center">';
					echo $module->content;
				echo'</div>';
			echo'</div>';
		echo'</section>';

	}
}

?>
