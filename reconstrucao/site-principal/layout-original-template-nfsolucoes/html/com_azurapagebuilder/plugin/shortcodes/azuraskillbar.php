<?php
/**
 * @package Azura Joomla Pagebuilder
 * @author Cththemes - www.cththemes.com
 * @date: 15-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */
//no direct accees
defined ('_JEXEC') or die('resticted aceess');

//[progress]
if(!function_exists('azuraskillbar_sc')){
	function azuraskillbar_sc($atts, $content=''){
		 extract(shortcode_atts(array(
	        "title" => '',
			"level" =>''
	     ), $atts));

	     $percent = (int)$level .'%';

	     $html = array();

	    $html[] = '<div class="skillbar-title" ><span>'.$title.'</span></div>';
		$html[] = '<div class="skill-bar-percent">'.$percent.'</div>';
		$html[] = '<div class="skillbar clearfix" data-percent="'.$percent.'">';
			$html[] = '<div class="skillbar-bar" ></div>';
		$html[] = '</div>';

     	return implode("\n", $html);
	}
	add_shortcode('AzuraSkillbar','azuraskillbar_sc');
}

