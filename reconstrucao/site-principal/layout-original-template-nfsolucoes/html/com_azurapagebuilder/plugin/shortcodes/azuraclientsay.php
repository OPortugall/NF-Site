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
if(!function_exists('azuraclientsay_sc')) {

	function azuraclientsay_sc( $atts, $content="" ) {
	
		extract(shortcode_atts(array(
			   'name' => '',
			   'via'=>'',
               'photo'=>''

		 ), $atts));

		$html = array();
		if(!empty($photo)){
			$html[] = '<div class="client-image">';
				$html[] = '<img src="'.JURI::base(true).'/'.$photo.'" class="respimg" alt="'.$name.'">';
			$html[] = '</div>';
		}
		
			$html[] = '<p>'.do_shortcode($content).'</p>';
			$html[] = '<span>- '.$name.' '.JText::_('COM_AZURA_SHORTCODE_CLIENT_VIA_TEXT').' '.$via.' -</span>';
        
			return implode("\n",$html);
        
	 
	}
		
	add_shortcode( 'AzuraClientSay', 'azuraclientsay_sc' );
}