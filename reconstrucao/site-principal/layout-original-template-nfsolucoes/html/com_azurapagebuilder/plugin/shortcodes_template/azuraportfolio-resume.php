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
	$class='class="'.$class.'"';
}
?>
<?php if(count($items)) : ?>

<div <?php echo $class;?>>
	<div class="resume-line animaper"></div>

	<?php foreach ($items as $key => $item) : 
		echo do_shortcode($item->introtext);
	?>
	<?php endforeach;?>
</div>
	<?php if($showfilter == '1') : ?>
		<div class="clear"></div>
		<a href="#" class="download-resume"><span class="transition">Download resume</span></a>
	<?php endif;?>
<?php endif;?>