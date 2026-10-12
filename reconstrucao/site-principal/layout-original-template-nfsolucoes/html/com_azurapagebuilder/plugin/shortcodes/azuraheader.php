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
if(!function_exists('azuraheader_sc')) {

	function azuraheader_sc( $atts, $content="" ) {
	
		extract(shortcode_atts(array(
			   'id' => '',
			   'class'=>'',
			   'heading'=>'h3',
			   'style'=>''
		 ), $atts));

		if($style == '1'){
			$classes = "azp_header border-header";
		}elseif($style == '2'){
			$classes = "azp_header small-header";
		}elseif($style == '3'){
			$classes = "azp_header line-header";
		}elseif($style == '4'){
			$classes = "azp_header sc-title";
		}else{
			$classes = "azp_header";
		}
		

		if(!empty($class)){
			$classes .= ' '.$class;
		}

		$classes = 'class="'.$classes.'"';
		 
		if(!empty($id)){
			$id = 'id="'.$id.'"';
		}
		
		if($style == '3'){
			$html = '<div '.$id.' '.$classes.'>';
				$html .= '<span>'.do_shortcode($content).'</span>';
			$html .='</div>';
		}elseif($style == '2'){
			$html = '<h2 '.$id.' '.$classes.'>';
				$html .= do_shortcode($content);
			$html .= '</h2>';
			$html .='<div class="header-separator"></div>';
		}else{
			$html = '<'.$heading.' '.$id.' '.$classes.'>';
				$html .= do_shortcode($content);
			$html .= '</'.$heading.'>';
		}
		
		return $html;
	 
	}
		
	add_shortcode( 'AzuraHeader', 'azuraheader_sc' );
}