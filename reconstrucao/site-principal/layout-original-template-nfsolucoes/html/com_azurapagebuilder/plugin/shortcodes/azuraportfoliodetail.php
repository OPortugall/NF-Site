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
if(!function_exists('azuraportfoliodetail_sc')) {

	function azuraportfoliodetail_sc( $atts, $content="" ) {
	
		extract(shortcode_atts(array(
			   'portfolioitemid' => '',
			   'description' => '',
         'client'=>'',
         'contenttype'=>'slider',
         'singlelink'=>'',
         'lanch'=>'',
         'photo1'=>'',
         'photo2'=>'',
         'photo3'=>'',
         'photo4'=>'',
         'photo5'=>'',
         'photo6'=>'',
         'photo7'=>'',
         'photo8'=>'',
         'photo9'=>'',
         'photo10'=>''
		 ), $atts));

        if($portfolioitemid == '0' || $portfolioitemid =='') return false;

        $item = CthShortcodes::getK2Item($portfolioitemid);

        if(!$item) return false;

        $tags = CthShortcodes::getK2ItemTagsFilter($item,", ",true);

        $itemCat = CthShortcodes::getK2Cat($item->catid);

        $lanchLink = CthShortcodes::getK2ItemLink($item->id, $item->alias, $itemCat->id, $itemCat->alias);

        $shortcodeTemp = false;

        $shortcodeTemp = CthShortcodes::addShortcodeTemplate('azuraportfoliodetail');

        $buffer = ob_get_clean();
        
        ob_start();
        
        if($shortcodeTemp !== false) require $shortcodeTemp;
        
        $content = ob_get_clean();
        
        ob_start();
        
        echo $buffer;
        
        return $content;
	}
		
	add_shortcode( 'AzuraPortfolioDetail', 'azuraportfoliodetail_sc' );
}