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

?>

<div id="ajaxpage">
	<div class="height-emulator"></div> 
	<div class="container">
		<h2><?php echo $item->title;?></h2>
		<div class="small-separator sepcolor"></div>
		<div class="clear"></div>
		
	<?php switch ($contenttype) {
		case 'slider': ?>
		<div class="grid-4">
			<div class="flexslider">
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
				<?php if(!empty($photo6)) : ?>
					<li><img src="<?php echo JURI::base(true).'/'.$photo6;?>" class="respimg"></li>
				<?php endif;?>
				<?php if(!empty($photo7)) : ?>
					<li><img src="<?php echo JURI::base(true).'/'.$photo7;?>" class="respimg"></li>
				<?php endif;?>
				<?php if(!empty($photo8)) : ?>
					<li><img src="<?php echo JURI::base(true).'/'.$photo8;?>" class="respimg"></li>
				<?php endif;?>
				<?php if(!empty($photo9)) : ?>
					<li><img src="<?php echo JURI::base(true).'/'.$photo9;?>" class="respimg"></li>
				<?php endif;?>
				<?php if(!empty($photo10)) : ?>
					<li><img src="<?php echo JURI::base(true).'/'.$photo10;?>" class="respimg"></li>
				<?php endif;?>
					
				</ul>
			</div>	

		</div>

		<?php 
			break;
		case 'gallery': ?>
		<div class="grid-4 popup-gallery">
		<?php if(!empty($photo1)) : ?>
			<a href="<?php echo JURI::base(true).'/'.$photo1;?>" class="grid-2" title="<?php echo $item->title ;?> Photo1"><span></span><img src="<?php echo JURI::base(true).'/'.$photo1;?>" class="respimg gal" alt="<?php echo $item->title ;?> Photo1" title="<?php echo $item->title ;?> Photo1"></a>
		<?php endif;?>
		<?php if(!empty($photo2)) : ?>
			<a href="<?php echo JURI::base(true).'/'.$photo2;?>" class="grid-2" title="<?php echo $item->title ;?> Photo2"><span></span><img src="<?php echo JURI::base(true).'/'.$photo2;?>" class="respimg gal" alt="<?php echo $item->title ;?> Photo2" title="<?php echo $item->title ;?> Photo2"></a>
		<?php endif;?>
		<?php if(!empty($photo3)) : ?>
			<a href="<?php echo JURI::base(true).'/'.$photo3;?>" class="grid-2" title="<?php echo $item->title ;?> Photo3"><span></span><img src="<?php echo JURI::base(true).'/'.$photo3;?>" class="respimg gal" alt="<?php echo $item->title ;?> Photo3" title="<?php echo $item->title ;?> Photo3"></a>
		<?php endif;?>
		<?php if(!empty($photo4)) : ?>
			<a href="<?php echo JURI::base(true).'/'.$photo4;?>" class="grid-2" title="<?php echo $item->title ;?> Photo4"><span></span><img src="<?php echo JURI::base(true).'/'.$photo4;?>" class="respimg gal" alt="<?php echo $item->title ;?> Photo4" title="<?php echo $item->title ;?> Photo4"></a>
		<?php endif;?>
		<?php if(!empty($photo5)) : ?>
			<a href="<?php echo JURI::base(true).'/'.$photo5;?>" class="grid-2" title="<?php echo $item->title ;?> Photo5"><span></span><img src="<?php echo JURI::base(true).'/'.$photo5;?>" class="respimg gal" alt="<?php echo $item->title ;?> Photo5" title="<?php echo $item->title ;?> Photo5"></a>
		<?php endif;?>
		<?php if(!empty($photo6)) : ?>
			<a href="<?php echo JURI::base(true).'/'.$photo6;?>" class="grid-2" title="<?php echo $item->title ;?> Photo6"><span></span><img src="<?php echo JURI::base(true).'/'.$photo6;?>" class="respimg gal" alt="<?php echo $item->title ;?> Photo6" title="<?php echo $item->title ;?> Photo6"></a>
		<?php endif;?>
		<?php if(!empty($photo7)) : ?>
			<a href="<?php echo JURI::base(true).'/'.$photo7;?>" class="grid-2" title="<?php echo $item->title ;?> Photo7"><span></span><img src="<?php echo JURI::base(true).'/'.$photo7;?>" class="respimg gal" alt="<?php echo $item->title ;?> Photo7" title="<?php echo $item->title ;?> Photo7"></a>
		<?php endif;?>
		<?php if(!empty($photo8)) : ?>
			<a href="<?php echo JURI::base(true).'/'.$photo8;?>" class="grid-2" title="<?php echo $item->title ;?> Photo8"><span></span><img src="<?php echo JURI::base(true).'/'.$photo8;?>" class="respimg gal" alt="<?php echo $item->title ;?> Photo8" title="<?php echo $item->title ;?> Photo8"></a>
		<?php endif;?>
		<?php if(!empty($photo9)) : ?>
			<a href="<?php echo JURI::base(true).'/'.$photo9;?>" class="grid-2" title="<?php echo $item->title ;?> Photo9"><span></span><img src="<?php echo JURI::base(true).'/'.$photo9;?>" class="respimg gal" alt="<?php echo $item->title ;?> Photo9" title="<?php echo $item->title ;?> Photo9"></a>
		<?php endif;?>
		<?php if(!empty($photo10)) : ?>
			<a href="<?php echo JURI::base(true).'/'.$photo10;?>" class="grid-2" title="<?php echo $item->title ;?> Photo10"><span></span><img src="<?php echo JURI::base(true).'/'.$photo10;?>" class="respimg gal" alt="<?php echo $item->title ;?> Photo10" title="<?php echo $item->title ;?> Photo10"></a>
		<?php endif;?>

		</div>
		<?php
			break;
		case 'youtube': 

		$id = array();
		// get youtube video id from link
		preg_match('/[\\?\\&]v=([^\\?\\&]+)/', $singlelink, $id);
        //support embed link pasted at link
        if(empty($id) || !is_array($id)){
            preg_match('/embed[\/]([^\\?\\&]+)[\\?]/', $singlelink, $id);
        }
		?>
		<div class="grid-4">
		<?php if(!empty($id[1])) : ?>
			<div class="video">
	            <iframe width="420" height="315" src="http://www.youtube.com/embed/<?php echo $id[1];?>" frameborder="0" allowfullscreen></iframe>
	        </div>
	    <?php endif;?>
	    </div>
		<?php
			break;
		case 'vimeo': 

		$id = array();
		// get vimeo video id from link
		preg_match('/http:\/\/vimeo.com\/(\d+)$/', $singlelink, $id);

		?>
		<div class="grid-4">
		<?php if(!empty($id[1])) : ?>
			<div class="video">
                <iframe src="http://player.vimeo.com/video/<?php echo $id[1];?>?color=f2eee5" width="500" height="281" frameborder="0" webkitallowfullscreen="" mozallowfullscreen="" allowfullscreen=""></iframe>
            </div>
        <?php endif;?>
        </div>
		<?php
			break;
		case 'image': ?>
		<div class="grid-4">
			<div class="video">
				<?php if(!empty($singlelink)) : ?>
				<img src="<?php echo JURI::base(true).'/'.$singlelink;?>" class="respimg">
			<?php endif;?>
			</div>
		</div>

		<?php
			break;
		case 'soundcloud': 

		$url = str_replace(":", "%3A", $singlelink);

		?>
		<div class="grid-4">
			<div class="video">
	            <iframe width="420" height="315" src="https://w.soundcloud.com/player/?url=<?php echo $url;?>&amp;auto_play=false&amp;hide_related=false&amp;visual=true" frameborder="0" allowfullscreen></iframe>
	        </div>
	    </div>
		<?php
			break;
	}   ?>

		<div class="grid-2">

			<div class="project-info">
			<?php if(!empty($description)) : ?>
				<div class="project-description">
				  <h3><?php echo JText::_('COM_AZURAPAGEBUILDER_PORTFOLIO_PROJECT_DESCRIPTION_TEXT');?></h3>
				   <p><?php echo $description;?></p>			   
				</div>
			<?php endif;?>
			
				<div class="project-details">
				  <h3><?php echo JText::_('COM_AZURAPAGEBUILDER_PORTFOLIO_PROJECT_DETAILS_TEXT');?></h3>
				  <?php if(!empty($client)) :?>
				  <p><span><?php echo JText::_('COM_AZURAPAGEBUILDER_PORTFOLIO_CLIENT_TEXT');?></span>: <?php echo $client;?></p>
				  <?php endif;?>
				  <p><span><?php echo JText::_('COM_AZURAPAGEBUILDER_PORTFOLIO_DATE_TEXT');?></span>: <?php echo JHtml::_('date',$item->created, 'jS F, Y');?></p>
				  <?php if(!empty($tags)) :?>
				  <p><span><?php echo JText::_('COM_AZURAPAGEBUILDER_PORTFOLIO_TAGS_TEXT');?></span>: <?php echo $tags;?></p>                                        
				  <?php endif;?>
				</div>
			</div>
			
		</div>
		<?php echo do_shortcode($content); ?>

	</div>
	
	<div class="height-emulator"></div>
	<?php if(!empty($lanch)) :?>
	<div class="lanch-holder">
		<div class="container">
			 <a href="<?php echo $lanchLink;?>" class="lanch-project"><?php echo JText::_('COM_AZURAPAGEBUILDER_PORTFOLIO_LANCH_TEXT');?></a>
		</div>	
	</div>	
	<?php endif;?>	
</div> 