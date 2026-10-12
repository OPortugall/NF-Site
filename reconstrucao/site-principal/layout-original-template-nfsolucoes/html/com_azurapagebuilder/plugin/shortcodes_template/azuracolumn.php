<?php 
/**
 * @package Azura Joomla Pagebuilder
 * @author Cththemes - www.cththemes.com
 * @date: 15-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */
defined('_JEXEC') or die;

if(!empty($class)){
	$columnwidthclass .= ' '.$class;
}

$columnwidthclass = 'class="'.$columnwidthclass.'"';
 
if(!empty($id)){
	$id = 'id="'.$id.'"';
}

if(!empty($customstyle)){
	$customstyle = 'style="'.$customstyle.'"';
}
?>

<div <?php echo $id . ' ' .$columnwidthclass.' '.$customstyle;?>><?php echo do_shortcode($content);?></div>