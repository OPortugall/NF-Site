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

$classes = 'image-popup';
switch ($popup) {
	case 'youtube':
		$classes = 'popup-youtube';
		break;
	case 'vimeo':
		$classes = 'popup-vimeo';
		break;
	case 'image':
		$classes = 'image-popup';
		break;
}
if(!empty($class)){
	$classes .= ' '.$class;
}
$classes = 'class="'.$classes.'"';
if(!empty($id)){
	$id = 'id="'.$id.'"';
}
$name = '';
$tttitle = '';
if($tooltip == '1'){
	$name = 'name="tooltip"';
	$tttitle = 'title="'.$tooltiptitle.'"';
}


?>

<a <?php echo $id . ' ' .$classes.' '.$name.' '.$tttitle;?> href="<?php echo $popuplink;?>"><span class="shortcode-link"><?php echo $title;?></span></a><br>
