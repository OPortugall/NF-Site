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

$circlePos = 'right-circle';
$datePos = 'right-date';
$headArrowPos = 'right-head-arrow';
$arrowPos = 'left-arrow';
$boxPos = '';
if($position == 'right'){
	$circlePos = 'left-circle';
	$datePos = 'left-date';
	$headArrowPos = 'left-head-arrow';
	$arrowPos = 'right-arrow';
	$boxPos = 'right right-box';
}
?>

<!-- block - <?php echo $position;?> -->
					
<div class="resume-holder">
	<div class="resume-box animaper <?php echo $boxPos;?>">
		<div class="resume-circle-holder <?php echo $circlePos;?>">
			<div class="resume-circle">
				<div class="resume-date <?php echo $datePos;?>"><span></span><?php echo $time;?></div>
			</div>
		</div>
		<div class="grid-full transition resume <?php echo $arrowPos;?>">
			<div class="resume-head <?php echo $headArrowPos;?>">
				<h3><?php echo $title;?></h3>
				<?php if(!empty($iconclass)) : ?>
				<div class="resume-icon"><i class="<?php echo $iconclass;?>"></i></div>
				<?php endif;?>
			</div>
			<?php switch ($contenttype) :
			case 'slider': ?>
			<div class="clear"></div>
			<div class="resume-slider">
				<ul class="slides">
					<?php if(!empty($photo1)) : ?>
						<li><img src="<?php echo JURI::base(true).'/'.$photo1;?>" class="respimg"></li>
					<?php endif;?>
					<?php if(!empty($photo2)) : ?>
						<li><img src="<?php echo JURI::base(true).'/'.$photo2;?>" class="respimg"></li>
					<?php endif;?>
					<?php if(!empty($photo3)) : ?>
						<li><img src="<?php echo JURI::base(true).'/'.$photo3;?>" class="respimg"></li>
					<?php endif;?>
					<?php if(!empty($photo4)) : ?>
						<li><img src="<?php echo JURI::base(true).'/'.$photo4;?>" class="respimg"></li>
					<?php endif;?>
					<?php if(!empty($photo5)) : ?>
						<li><img src="<?php echo JURI::base(true).'/'.$photo5;?>" class="respimg"></li>
					<?php endif;?>
						
				</ul>
			</div>	
			<?php
				break;
			case 'image': ?>
			<?php if(!empty($singlelink)) : ?>
				<a class="image-popup" href="<?php echo JURI::base(true).'/'.$singlelink;?>" title="<?php echo $title;?>">
					<span></span>
					<img src="<?php echo JURI::base(true).'/'.$singlelink;?>" class="respimg" alt="<?php echo $title;?>">
				</a>
			<?php endif;?>

			<?php
				break; 
			endswitch; ?>
			
			<p><?php echo do_shortcode($content);?></p>
		
		</div>
	</div>
</div>