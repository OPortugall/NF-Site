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
if(!function_exists('azuratext_sc')) {

	function azuratext_sc( $atts, $content="" ) {
	
		extract(shortcode_atts(array(
			   'id' => '',
			   'class' => '',
               'wrapper'=>''
		 ), $atts));
         
         $html = '';
         if(!empty($wrapper)){
            $html .= '<'.$wrapper;
            if(!empty($class)){
                $html .= ' class="'.$class.'"';
            }
            if(!empty($id)){
                $html .= ' id="'.$id.'"';
            }
            $html .='>';
         }
	       $html .= do_shortcode($content);
        if(!empty($wrapper)){
            $html .= '</'.$wrapper.'>';
         }
	 
        return $html;
	}
		
	add_shortcode( 'AzuraText', 'azuratext_sc' );
}