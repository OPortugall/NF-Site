<?php
/**
 * @package Cashemir - Responsive One Page Joomla Template
 * @author Cththemes - www.cththemes.com
 * @date: 29-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */

// no direct access
defined('_JEXEC') or die;

// Define default image size (do not change)
//K2HelperUtilities::setDefaultImage($this->item, 'itemlist', $this->params);

$extraFields = json_decode($this->item->extra_fields);
$postType = $extraFields[0]->value;
$postLink = $extraFields[1]->value;
//echo'<pre>';var_dump($this->item);die;

// $filter = getItemTagsFilter($this->item);
?>

<!-- Standard Post -->
<div class="post">
	<div class="post-decor"></div>
	<span class="date"><?php echo JHTML::_('date', $this->item->created, 'd'); ?> <br><small><?php echo JHTML::_('date', $this->item->created, 'M'); ?> </small></span>
	<div class="post-media">
	<?php if($postType == '1') : ?>
		<img alt="<?php echo $this->item->title;?>" class="respimg" src="<?php echo JURI::root(true).$postLink;?>">
	<?php elseif($postType == '4') : ?>
		<div class="single-media">
			<ul class="slides">
	<?php
    	foreach ($extraFields as $key => $field) :
    	if($key > 0 && trim($field->value) !='') :
    ?>
			<li>
				<img alt="Image <?php echo ($key+1);?>" class="respimg" src="<?php echo JURI::root(true).$field->value;?>" >
			</li>
	<?php endif; endforeach; ?>
			</ul>
		</div>
	<?php elseif($postType == '2') : 
		$id = array();
		// get youtube video id from link
		preg_match('/[\\?\\&]v=([^\\?\\&]+)/', $postLink, $id);
        //support embed link pasted at link
        if(empty($id) || !is_array($id)){
            preg_match('/embed[\/]([^\\?\\&]+)[\\?]/', $postLink, $id);
        }
    	if(!empty($id[1])) :
	?>
		<div class="video-container">
			<!-- youtube -->
			<iframe src="http://www.youtube.com/embed/<?php echo $id[1];?>?" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
			<!-- End youtube -->
		</div>
		<?php endif;?>
	<?php elseif($postType == '3') :

	$id = array();
	// get vimeo video id from link
	preg_match('/http:\/\/vimeo.com\/(\d+)$/', $postLink, $id);

	if(!empty($id[1])) :

	?>
		<div class="video-container">
			<!-- Vimeo -->
			<iframe  src="http://player.vimeo.com/video/<?php echo $id[1];?>?title=0&amp;byline=0&amp;portrait=0" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
			<!-- End Vimeo -->
		</div>
	<?php endif;?>
	
	<?php elseif($postType == '5') : 
		$url = str_replace(":", "%3A", $postLink);
	?>
		<div class="video-container">
			<iframe src="https://w.soundcloud.com/player/?url=<?php echo $url;?>&amp;auto_play=false&amp;hide_related=false&amp;visual=true" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
		</div>
	<?php endif;?>

	</div>
	<div class="post-title">
		<?php if ($this->item->params->get('catItemTitleLinked')): ?>
			<h2>
			<a href="<?php echo $this->item->link; ?>"><?php echo $this->item->title; ?></a>
			</h2>
	  		
	  	<?php else: ?>
	  	<h2><?php echo $this->item->title; ?></h2>
	  	<?php endif; ?>	
		<div class="post-meta">
			<h6><?php if($this->item->params->get('catItemAuthor')): ?>
				<?php echo JText::_('TPL_CASHEMIR_POSTED_BY_TEXT');?> 
					<!-- Item Author -->
					<?php if(isset($this->item->created_by_alias) && !empty($this->item->created_by_alias)): ?>
					<a href="#"><?php echo $this->item->created_by_alias; ?></a>
					<?php else: ?>
					<a href="#"><?php echo $this->item->created_by; ?></a>
					<?php endif; ?>

				<?php endif; ?> 
				
				<?php if($this->item->params->get('catItemCategory')): ?>
					<!-- Item category name --> 
					 / <a href="#"><?php echo $this->item->category->categoryname; ?></a>
				<?php endif; ?>
			</h6>							
		</div>
	</div>				
		
	<div class="post-body">
		<?php if($this->item->params->get('catItemIntroText')): ?>
				<!-- Item introtext -->
			  	<?php echo $this->item->introtext; ?>
			
			<?php endif; ?>
		<?php if ($this->item->params->get('catItemReadMore')): ?>
		<!-- Item "read more..." link -->
		<div>
			<a href="<?php echo $this->item->link; ?>" class="transition"><?php echo JText::_('TPL_CASHEMIR_READ_MORE_TEXT'); ?></a>
		</div>
		<?php endif; ?>
	</div>
</div>
