import GreenToRedSlider from './GreenToRedSlider'
import * as storage from '../../modules/storage/storage'
/**
 * Class that subclasses the GreenToRedSlider to a single purpose. This class updates the interceptionInterval
 * of the user's settings.
 *
 * @class IntervalSlider
 */

export default class IntervalSlider extends GreenToRedSlider {

    constructor(sliderID) {
        super(sliderID, function(value) {
            storage.getSettings((settings_object) => {
                settings_object.interceptionInterval = parseInt(value);
                storage.setSettings(settings_object);
            });
        });
    }

}