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

$name = '';
$title = '';

if($button['tooltip'] == '1'){
	$name='name="tooltip"';
	$title = 'title="'.$button['tooltiptitle'].'"';
}

$style='';
if(!empty($button['backgroundcolor'])){
	$style .='background:'.$button['backgroundcolor'].';';
}
if(!empty($button['customstyle'])){
	$style.= $button['customstyle'];
}
if(!empty($style)){
	$style = 'style="'.$style.'"';
}

?>
<li <?php echo $style.' '.$name.' '.$title;?>>
	<a href="<?php echo $button['link'];?>" class="<?php echo $button['class'];?>" target="<?php echo $button['target'];?>">
		<i class="<?php echo $button['iconclass'];?>"></i>
		<?php if(!empty($button['text'])){
			 echo $button['text'];
		} ?>
	</a>
</li>
