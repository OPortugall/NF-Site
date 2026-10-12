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
if(!function_exists('azurablockquote_sc')) {

	function azurablockquote_sc( $atts, $content="" ) {
	
		extract(shortcode_atts(array(
			   'id' => '',
			   'class' => '',
               'tooltip'=>'1',
               'title'=>''
		 ), $atts));
         

        if(!empty($class)){
            $class = ' class="'.$class.'"';
        }

        if(!empty($id)){
            $id = ' id="'.$id.'"';
        }

        if(!empty($title)){
            $title = ' title="'.$title.'"';
        }

        $name = '';

        if($tooltip == '1'){
            $name = 'name="tooltip"';
        }

        $html = '<div '.$id.' '.$class.' '.$name.' '.$title.'>';
            $html .= '<p>'.do_shortcode($content).'</p>';
        $html .='</div>';
            
	 
        return $html;
	}
		
	add_shortcode( 'AzuraBlockquote', 'azurablockquote_sc' );
}