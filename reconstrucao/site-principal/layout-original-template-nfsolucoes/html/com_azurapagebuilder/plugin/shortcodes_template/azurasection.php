<?php
/**
 * @package Azura Joomla Pagebuilder
 * @author Cththemes - www.cththemes.com
 * @date: 15-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */
defined('_JEXEC') or die();

$classes = "azp_sections";

if(!empty($class)){
	$classes .= ' '.$class;
}

$classes = 'class="'.$classes.'"';
 
if(!empty($id)){
	$id = 'id="'.$id.'"';
}

if(!empty($subwrapperclass)){
	$subwrapperclass = 'class="'.$subwrapperclass.'"';
}

$html = '<'.$wrappertag.' '.$id.' '.$classes.' '.(!empty($sectionbgimage)? 'style="background-image: url(\''.JURI::base(true).'/'.$sectionbgimage.'\');"':'').'>';
	$html .='<div '.$subwrapperclass.'>';
		$html .= do_shortcode($content);
	$html .='</div>';
$html .= '</'.$wrappertag.'>';

echo $html;

?>