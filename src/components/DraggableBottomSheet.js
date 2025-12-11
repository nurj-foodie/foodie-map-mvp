import React, { useState, useRef } from 'react';
import './DraggableBottomSheet.css';

const DraggableBottomSheet = ({
    children,
    routeSummary,
    onSave,
    onLoad,
    sheetState: controlledState,
    onStateChange
}) => {
    // Three states: 'collapsed' (bottom), 'mid', 'full'
    const [sheetState, setSheetState] = useState('collapsed');
    const sheetRef = useRef(null);
    const touchStartY = useRef(null);
    const startHeight = useRef(null);

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
        if (sheetRef.current) {
            startHeight.current = sheetRef.current.clientHeight;
        }
    };

    const handleTouchMove = (e) => {
        if (!touchStartY.current) return;

        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY.current - currentY;

        // Swipe up to expand (deltaY > 0)
        // Swipe down to collapse (deltaY < 0)
        if (Math.abs(deltaY) > 50) {
            if (deltaY > 0) {
                // Swipe up
                if (sheetState === 'collapsed') {
                    setSheetState('mid');
                    onStateChange?.('mid');
                } else if (sheetState === 'mid') {
                    setSheetState('full');
                    onStateChange?.('full');
                }
            } else {
                // Swipe down
                if (sheetState === 'full') {
                    setSheetState('mid');
                    onStateChange?.('mid');
                } else if (sheetState === 'mid') {
                    setSheetState('collapsed');
                    onStateChange?.('collapsed');
                }
            }
            touchStartY.current = null;
        }
    };

    const handleTouchEnd = () => {
        touchStartY.current = null;
    };

    const cycleState = () => {
        // Click cycles through: collapsed → mid → full → collapsed
        if (sheetState === 'collapsed') {
            setSheetState('mid');
            onStateChange?.('mid');
        } else if (sheetState === 'mid') {
            setSheetState('full');
            onStateChange?.('full');
        } else {
            setSheetState('collapsed');
            onStateChange?.('collapsed');
        }
    };

    const currentState = controlledState ?? sheetState;

    return (
        <div
            ref={sheetRef}
            className={`draggable-bottom-sheet ${currentState}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Drag Handle */}
            <div
                className="drag-handle"
                onClick={cycleState}
                role="button"
                aria-label="Drag to expand or collapse"
            />

            {/* Sheet Header */}
            <div className="sheet-header">
                <div className="route-summary">{routeSummary}</div>
                <div className="action-icons">
                    <button
                        onClick={onSave}
                        className="icon-btn"
                        aria-label="Save route"
                        title="Save Route"
                    >
                        💾
                    </button>
                    <button
                        onClick={onLoad}
                        className="icon-btn"
                        aria-label="Load saved routes"
                        title="Load Routes"
                    >
                        📂
                    </button>
                </div>
            </div>

            {/* Sheet Content */}
            <div className="sheet-content">
                {children}
            </div>
        </div>
    );
};

export default DraggableBottomSheet;
