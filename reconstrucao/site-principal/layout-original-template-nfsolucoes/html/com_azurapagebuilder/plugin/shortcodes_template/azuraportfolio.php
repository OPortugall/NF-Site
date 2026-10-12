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
<?php if(count($items)) : ?>
<!-- portfolio filters -->

<div id="options" class="clear">

  <ul id="filters" class="option-set" data-option-key="filter">
  
	<li class="filter actcat" data-filter="all"><?php echo JText::_('COM_AZURAPAGEBUILDER_PORTFOLIO_FILTER_ALL_TEXT');?></li>
	<?php if(isset($tagsFilter) && count($tagsFilter)): 
		foreach($tagsFilter as $key=>$tag): 
	?>
	<li class="filter" data-filter="<?php echo strtolower(str_replace(" ","-",$tag)); ?>"><?php echo ucfirst($tag); ?> </li>
	<?php endforeach;
		endif;?>
  </ul>
  
</div> 

<!-- Projects links -->

<div class="aih">

	<ul id="folio_container" class="grid-full animaper">
	<?php foreach ($items as $key => $item) : 

		$extraFields = json_decode($item->extra_fields);
	?>
	<!-- project <?php echo ($key+1);?>-->
	
		<li class="box  mix <?php echo CthShortcodes::getK2ItemTagsFilter($item);?> mix_all">
			<a href="#!<?php echo CthShortcodes::getK2ItemLink($item->id, $item->alias, $item->catid, $item->categoryalias);?>?viewtype=ajax&amp;tmpl=component">
				<?php if($extraFields[0]->value) : ?>
				<img src="<?php echo JURI::root(true).$extraFields[0]->value ;?>" class="respimg" alt="<?php echo preg_replace('/--([^-]*)--/', '$1', $item->title);?>" title="<?php echo preg_replace('/--([^-]*)--/', '$1', $item->title);?>">
				<?php endif;?>
				<div class="folio-name clear">
					<div class="folio-overlay">
						<span class="overlay red"></span>
						<h4><?php echo preg_replace('/--([^-]*)--/', '$1', $item->title);?></h4>							
						<h6><?php echo $extraFields[1]->value;?></h6>
					</div>
				</div>
			</a>
			
		</li>
		
	<?php endforeach;?>
		
	</ul>
	
</div>

 <!-- ajax-section -->
 
 <div class="clear"></div>
<div id="ajax-section">     
	<div id="loader"></div>
	<div id="ajax-content-outer">
		<div id="ajax-content-inner"></div>
	</div>
	<div id="project-navigation">
		<ul>
			<li id="prevProject"><a href="#"></a></li>
			<li id="nextProject"><a href="#"></a></li>
		</ul>  
	</div>
	<div id="closeProject">
		<div class="grid-3">
			<a href="#/"><?php echo JText::_('COM_AZURAPAGEBUILDER_PORTFOLIO_CLOSE_TEXT');?></a>
		</div>               
	</div>                  
</div>
<!-- ajax-section end -->
<?php endif;?>