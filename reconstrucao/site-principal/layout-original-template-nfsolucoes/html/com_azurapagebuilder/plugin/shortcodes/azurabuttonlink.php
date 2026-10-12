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

//[Icon]
if(!function_exists('azurabuttonlink_sc')) {

	function azurabuttonlink_sc( $atts, $content="" ) {
	
		extract(shortcode_atts(array(
			'id'=>'',
			'class'=>'',
			'text'=>'',
			'image'=>'',
			'link'=>'',
			'title'=>'',
			'target'=>''
		 ), $atts));
		 
		if(!empty($id)) {
			$id = 'id="'.$id.'"';
		}
		$classes = 'btn';
		if(!empty($class)) {
			$classes .= ' '.$class;
		}
		$classes = 'class="'.$classes.'"';
		if(!empty($target)) {
			$target = 'target="'.$target.'"';
		}
		if(!empty($title)) {
			$title = 'title="'.$title.'"';
		}
		if(!empty($link)) {
			$link = 'href="'.$link.'"';
		}

		$html = '<a '.$id.' '.$classes.' '.$link.' '.$target.' '.$title.'>';
			if(!empty($image)){
				$html .='<img src="'.JURI::base(true).'/'.$image.'" alt="" >';
			}else{
				$html .= $text;
			}
		$html .='</a>';


		return $html;
	 
	}
		
	add_shortcode( 'AzuraButtonLink', 'azurabuttonlink_sc' );
}