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
if(!function_exists('azurastat_sc')){
	function azurastat_sc($atts, $content=''){
		 extract(shortcode_atts(array(
	        "id" => '',
			"extraclass" =>'',
			"title" => '',
			"value" =>'0',
			"iconclass"=>''
	     ), $atts));

	     $classes = 'stats';

	     if(!empty($extraclass)){
	     	$classes .=' '.$extraclass;
	     }

	     $classes = 'class="'.$classes.'"';

	     $html = array();

	    $html[] = '<div class="milestone-counter">';
			
			$html[] = '<div '.$classes.'>';
				$html[] = '<div class="num" data-content="'.(int)$value.'" data-num="'.(int)$value.'">0</div>';
			$html[] = '</div>';
		$html[] = '</div>';

		if(!empty($title) || !empty($iconclass)){
			$html[] = '<h6>';
			if(!empty($iconclass)){
				$html[] = '<i class="'.$iconclass.'"></i>';
			}
			if(!empty($title)){
				$html[] = '<span>'.$title.'</span>';
			}

			$html[] = '</h6>';
		}
			 
     	return implode("\n", $html);
	}
	add_shortcode('AzuraStat','azurastat_sc');
}

