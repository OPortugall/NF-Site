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
	$class = 'class="'.$class.'"';
}
 
if(!empty($id)){
	$id = 'id="'.$id.'"';
}
?>

<iframe <?php echo $id.' '.$class;?> src="<?php echo $src;?>" width="<?php echo $width;?>" height="<?php echo $height;?>" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>