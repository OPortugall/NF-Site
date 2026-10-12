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

if($params['id']){
	$params['id'] = 'id="'.$params['id'].'"';
}

$classes = '';
if ($params['class']) {
	$classes = 'class="'.$params['class'].'"';
}

$active = 0;
if((int)$params['defaultactive']){
	$active = (int)$params['defaultactive'] -1;
}


?>

<?php if($params['style'] == 'tab') :?>
	<?php 
		$tabTab = array();
		$tabContent = array();
		foreach ($azuraTabToggleArray as $key=>$tab){
			if(!empty($tab['iconclass'])){
				$tab['iconclass'] = '<i class="'.$tab['iconclass'].'"></i>';
			}
			if(!empty($tab['id'])){
				$tab['id'] = 'id="'.$tab['id'].'"';
			}
			if(!empty($tab['class'])){
				$tab['class'] = 'class="'.$tab['class'].'"';
			}
			$tabHrefID = uniqid('tabHrefID');
			$tabTab[] = '<li '.$tab['id'].' '.$tab['class'].'><a href="#'.$tabHrefID.'">'.$tab['title'].' '.$tab['iconclass'].'</a></li>';
			$tabContent[] = '<div class="azp_tab-content" id="'.$tabHrefID.'"><p>'.do_shortcode($tab['content']).'</p></div>';
		}
	?>

	<div <?php echo $params['id'].' '.$classes;?>>
		<ul>
			<?php echo implode("\n", $tabTab);?>
		</ul>

		<?php echo implode("\n", $tabContent); ?>

	</div>

<?php else : 
	foreach ($azuraTabToggleArray as $key=>$toggle) {
		$tClass = 'toggle';
		if(!empty($toggle['class'])){
			$tClass .=' '.$toggle['class'];
		}
		$tClass = 'class="'.$tClass.'"';
		if(!empty($toggle['id'])){
			$toggle['id'] = 'id="'.$toggle['id'].'"';
		}
?>
	<div <?php echo $toggle['id'].' '.$tClass;?>>
		<div class="toggle-title<?php echo (($key === $active)? ' active': '');?>">
			<h5>
				<?php if(!empty($toggle['iconclass'])):?>
				<span class="title-icon"><i class="<?php echo $toggle['iconclass'];?>"></i></span>
				<?php endif;?>

				<span class="title-name"><?php echo $toggle['title'];?></span>
			</h5>
		</div>
		<div class="toggle-inner">
		<?php echo do_shortcode($toggle['content']);?>
		</div>
	</div>
<?php } endif;?> 