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

$classes = 'accordion-title';
if(!empty($class)){
	$classes .= ' '.$class;
}

$classes = 'class="'.$classes.'"';
 
if(!empty($id)){
	$id = 'id="'.$id.'"';
}


?>

<div <?php echo $id . ' ' .$classes;?>>
	<h5>
	<?php if(!empty($iconclass)) : ?>
		<span><i class="<?php echo $iconclass;?>"></i></span>
	<?php endif;?>
		<a href="#"><?php echo $title;?></a>
	</h5>
</div>
<div class="accordion-inner">
	<?php echo do_shortcode($content);?>
</div>