/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import { press, click, hover, sleep } from '@ariakit/test';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { formatLowercase, formatUppercase } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../../button';
import {
	ToggleGroupControl,
	ToggleGroupControlOption,
	ToggleGroupControlOptionIcon,
} from '../index';
import { TOOLTIP_DELAY } from '../../tooltip';
import type { ToggleGroupControlProps } from '../types';

const hoverOutside = async () => {
	await hover( document.body );
	await hover( document.body, { clientX: 10, clientY: 10 } );
};

const ControlledToggleGroupControl = ( {
	value: valueProp,
	onChange,
	extraButtonOptions,
	...props
}: ToggleGroupControlProps & {
	extraButtonOptions?: { name: string; value: string }[];
} ) => {
	const [ value, setValue ] = useState( valueProp );

	return (
		<>
			<ToggleGroupControl
				{ ...props }
				onChange={ ( ...changeArgs ) => {
					setValue( ...changeArgs );
					onChange?.( ...changeArgs );
				} }
				value={ value }
			/>
			<Button onClick={ () => setValue( undefined ) }>Reset</Button>
			{ extraButtonOptions?.map( ( obj ) => (
				<Button
					key={ obj.value }
					onClick={ () => setValue( obj.value ) }
				>
					{ obj.name }
				</Button>
			) ) }
		</>
	);
};
const options = (
	<>
		<ToggleGroupControlOption value="rigas" label="R" />
		<ToggleGroupControlOption value="jack" label="J" />
	</>
);
const optionsWithTooltip = (
	<>
		<ToggleGroupControlOption
			value="gnocchi"
			label="Delicious Gnocchi"
			aria-label="Click for Delicious Gnocchi"
			showTooltip={ true }
		/>
		<ToggleGroupControlOption
			value="caponata"
			label="Sumptuous Caponata"
			aria-label="Click for Sumptuous Caponata"
		/>
	</>
);

describe.each( [
	[ 'uncontrolled', ToggleGroupControl ],
	[ 'controlled', ControlledToggleGroupControl ],
] )( 'ToggleGroupControl %s', ( ...modeAndComponent ) => {
	const [ mode, Component ] = modeAndComponent;

	describe( 'should render correctly', () => {
		it( 'with text options', () => {
			const { container } = render(
				<Component label="Test Toggle Group Control">
					{ options }
				</Component>
			);

			expect( container ).toMatchSnapshot();
		} );

		it( 'with icons', () => {
			const { container } = render(
				<Component value="uppercase" label="Test Toggle Group Control">
					<ToggleGroupControlOptionIcon
						value="uppercase"
						icon={ formatUppercase }
						label="Uppercase"
					/>
					<ToggleGroupControlOptionIcon
						value="lowercase"
						icon={ formatLowercase }
						label="Lowercase"
					/>
				</Component>
			);

			expect( container ).toMatchSnapshot();
		} );
	} );
	it( 'should call onChange with proper value', async () => {
		const mockOnChange = jest.fn();

		render(
			<Component
				value="jack"
				onChange={ mockOnChange }
				label="Test Toggle Group Control"
			>
				{ options }
			</Component>
		);

		await click( screen.getByRole( 'radio', { name: 'R' } ) );

		expect( mockOnChange ).toHaveBeenCalledWith( 'rigas' );
	} );

	it( 'should render tooltip where `showTooltip` === `true`', async () => {
		render(
			<Component label="Test Toggle Group Control">
				{ optionsWithTooltip }
			</Component>
		);

		const firstRadio = screen.getByLabelText(
			'Click for Delicious Gnocchi'
		);

		await hover( firstRadio );

		const tooltip = await screen.findByRole( 'tooltip', {
			name: 'Click for Delicious Gnocchi',
		} );

		await waitFor( () => expect( tooltip ).toBeVisible() );

		// hover outside of radio
		await hoverOutside();

		// Tooltip should hide
		expect(
			screen.queryByRole( 'tooltip', {
				name: 'Click for Delicious Gnocchi',
			} )
		).not.toBeInTheDocument();
	} );

	it( 'should not render tooltip', async () => {
		render(
			<Component label="Test Toggle Group Control">
				{ optionsWithTooltip }
			</Component>
		);

		const secondRadio = screen.getByLabelText(
			'Click for Sumptuous Caponata'
		);

		await hover( secondRadio );

		// Tooltip shouldn't show
		expect(
			screen.queryByText( 'Click for Sumptuous Caponata' )
		).not.toBeInTheDocument();

		// Advance time by default delay
		await sleep( TOOLTIP_DELAY );

		// Tooltip shouldn't show.
		expect(
			screen.queryByText( 'Click for Sumptuous Caponata' )
		).not.toBeInTheDocument();
	} );

	if ( mode === 'controlled' ) {
		it( 'should reset values correctly', async () => {
			render(
				<Component label="Test Toggle Group Control">
					{ options }
				</Component>
			);

			const rigasOption = screen.getByRole( 'radio', { name: 'R' } );
			const jackOption = screen.getByRole( 'radio', { name: 'J' } );

			await click( rigasOption );

			expect( jackOption ).not.toBeChecked();
			expect( rigasOption ).toBeChecked();

			await press.ArrowRight();

			expect( rigasOption ).not.toBeChecked();
			expect( jackOption ).toBeChecked();

			await click( screen.getByRole( 'button', { name: 'Reset' } ) );

			expect( rigasOption ).not.toBeChecked();
			expect( jackOption ).not.toBeChecked();
		} );

		it( 'should update correctly when triggered by external updates', async () => {
			render(
				<Component
					value="rigas"
					label="Test Toggle Group Control"
					extraButtonOptions={ [
						{ name: 'Rigas', value: 'rigas' },
						{ name: 'Jack', value: 'jack' },
					] }
				>
					{ options }
				</Component>
			);

			expect( screen.getByRole( 'radio', { name: 'R' } ) ).toBeChecked();
			expect(
				screen.getByRole( 'radio', { name: 'J' } )
			).not.toBeChecked();

			await click( screen.getByRole( 'button', { name: 'Jack' } ) );
			expect( screen.getByRole( 'radio', { name: 'J' } ) ).toBeChecked();
			expect(
				screen.getByRole( 'radio', { name: 'R' } )
			).not.toBeChecked();

			await click( screen.getByRole( 'button', { name: 'Rigas' } ) );
			expect( screen.getByRole( 'radio', { name: 'R' } ) ).toBeChecked();
			expect(
				screen.getByRole( 'radio', { name: 'J' } )
			).not.toBeChecked();

			await click( screen.getByRole( 'button', { name: 'Reset' } ) );
			expect(
				screen.getByRole( 'radio', { name: 'R' } )
			).not.toBeChecked();
			expect(
				screen.getByRole( 'radio', { name: 'J' } )
			).not.toBeChecked();
		} );
	}

	describe( 'isDeselectable', () => {
		describe( 'isDeselectable = false', () => {
			it( 'should not be deselectable', async () => {
				const mockOnChange = jest.fn();

				render(
					<Component
						value="rigas"
						label="Test"
						onChange={ mockOnChange }
					>
						{ options }
					</Component>
				);

				const rigas = screen.getByRole( 'radio', {
					name: 'R',
					checked: true,
				} );
				await click( rigas );
				expect( mockOnChange ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'should not tab to next radio option', async () => {
				render(
					<>
						<Component value="rigas" label="Test">
							{ options }
						</Component>
						<button>After ToggleGroupControl</button>
					</>
				);

				const rigas = screen.getByRole( 'radio', {
					name: 'R',
				} );

				await press.Tab();
				expect( rigas ).toHaveFocus();

				await press.Tab();

				// When in controlled mode, there is an additional "Reset" button.
				const expectedFocusTarget =
					mode === 'uncontrolled'
						? screen.getByRole( 'button', {
								name: 'After ToggleGroupControl',
						  } )
						: screen.getByRole( 'button', { name: 'Reset' } );

				expect( expectedFocusTarget ).toHaveFocus();
			} );
		} );

		describe( 'isDeselectable = true', () => {
			it( 'should be deselectable', async () => {
				const mockOnChange = jest.fn();

				render(
					<Component
						value="rigas"
						label="Test"
						onChange={ mockOnChange }
						isDeselectable
					>
						{ options }
					</Component>
				);

				await click(
					screen.getByRole( 'button', {
						name: 'R',
						pressed: true,
					} )
				);
				expect( mockOnChange ).toHaveBeenCalledTimes( 1 );
				expect( mockOnChange ).toHaveBeenLastCalledWith( undefined );

				await click(
					screen.getByRole( 'button', {
						name: 'R',
						pressed: false,
					} )
				);
				expect( mockOnChange ).toHaveBeenCalledTimes( 2 );
				expect( mockOnChange ).toHaveBeenLastCalledWith( 'rigas' );
			} );

			it( 'should tab to the next option button', async () => {
				render(
					<Component isDeselectable value="rigas" label="Test">
						{ options }
					</Component>
				);

				await press.Tab();
				expect(
					screen.getByRole( 'button', {
						name: 'R',
						pressed: true,
					} )
				).toHaveFocus();

				await press.Tab();
				expect(
					screen.getByRole( 'button', {
						name: 'J',
						pressed: false,
					} )
				).toHaveFocus();

				// Focus should not move with arrow keys
				await press.ArrowLeft();
				expect(
					screen.getByRole( 'button', {
						name: 'J',
						pressed: false,
					} )
				).toHaveFocus();
			} );
		} );
	} );
} );
