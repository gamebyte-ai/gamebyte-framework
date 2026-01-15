/**
 * GameByte Framework - Minimal TypeScript Example
 *
 * This example shows how to use the framework with just a few lines of code.
 */

import * as PIXI from 'pixi.js';
import { ArcheroMenu, ARCHERO_COLORS } from './src/index';

(async () => {
    // 1. Create PixiJS app
    const app = new PIXI.Application();
    await app.init({
        width: 1080,
        height: 1920,
        backgroundColor: 0x1a1a2e
    });
    document.body.appendChild(app.canvas);

    // 2. Create menu - just one call!
    const menu = new ArcheroMenu({
        sections: [
            { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
            { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
            { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green }
        ],
        activeSection: 1,
        canvasWidth: 1080,
        canvasHeight: 1920,
        enableSwipe: true
    });

    // 3. Add to stage - done!
    app.stage.addChild(menu);
})();
