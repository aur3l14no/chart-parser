import React, { useState } from 'react';
import './App.css';
import { Tldraw, TDShapeType } from '@tldraw/tldraw';
import { create, all } from 'mathjs';
import _ from 'lodash';

const math = create(all, {})

// debug
window.math = math
window._ = _

const showUsage = false
const doMock = false
const debug = false

const usage = `Usage:
 1. Paste the chart
 2. Mark axes with arrows
 3. Mark xMax, yMax with Text
 4. Mark points with Draw (you may group them with colors)
`

const calcPosition = (origin, endpoints, points, xMax = 1, yMax = 1, xLogScale = false, yLogScale = false) => {
  const relEndpoints = [
    math.multiply(1 / xMax, math.subtract(endpoints[0], origin)),
    math.multiply(1 / yMax, math.subtract(endpoints[1], origin))
  ]
  const inverse = math.inv(relEndpoints)
  const results = points.map(p => math.multiply(inverse, math.subtract(p.slice(0, 2), origin)))
  const fixedResults = results.map(p => [
    xLogScale ? math.pow(xMax, p[0] / xMax) : p[0],
    yLogScale ? math.pow(yMax, p[1] / yMax) : p[1]
  ])
  return fixedResults
}


const analyze = e => {
  const shapes = e.getShapes()
  const arrows = shapes.filter(s => s.type === 'arrow')
  const draws = shapes.filter(s => s.type === 'draw')

  if (arrows.length !== 2 || draws.length === 0) return null;
  const origin = arrows[0].point
  const sortedArrows = arrows[0].handles.end[0] < arrows[1].handles.end[0] ? arrows.reverse() : arrows
  const sortedEndpoints = sortedArrows.map(arrow => math.add(arrow.handles.end.point, arrow.point))
  const groupedDraws = _.groupBy(draws, d => d.style.color)
  const groupedPoints = _.mapValues(groupedDraws, draws => draws.map(d => d.point))
  const [xMax, yMax] = sortedArrows.map(arrow => parseInt(arrow.label))
  const groupedCoordinates = _.mapValues(groupedPoints, points =>
    calcPosition(
      origin,
      sortedEndpoints,
      points,
      xMax,
      yMax,
      sortedArrows[0].style.dash === 'dashed' || sortedArrows[0].style.dash === 'dotted' ? true : false,
      sortedArrows[1].style.dash === 'dashed' || sortedArrows[1].style.dash === 'dotted' ? true : false,
    ))
  return groupedCoordinates
}

const mock = e => {
  e.createShapes(
    {
      id: 'origin',
      type: TDShapeType.Ellipse,
      point: [350, 700],
      radius: [1, 1],
    },
    {
      id: 'x-axis',
      type: TDShapeType.Arrow,
      handles: {
        start: { id: 'start', point: [0, 0] },
        end: { id: 'end', point: [400, 0] },
        bend: { id: 'bend', point: [200, 0] },
      },
      decorations: {
        end: 'arrow'
      },
      point: [350, 700],
      label: "200",
    },
    {
      id: 'y-axis',
      type: TDShapeType.Arrow,
      handles: {
        start: { id: 'start', point: [0, 400] },
        end: { id: 'end', point: [0, 0] },
        bend: { id: 'bend', point: [0, 200] },
      },
      decorations: {
        end: 'arrow'
      },
      point: [350, 300],
      label: "100"
    },
    {
      id: 'p-1',
      type: TDShapeType.Draw,
      point: [500, 600, 0.5],
      style: { color: 'red' }
    },
    {
      id: 'p-2',
      type: TDShapeType.Draw,
      point: [600, 600, 0.5],
      style: { color: 'red' }
    },
    {
      id: 'p-3',
      type: TDShapeType.Draw,
      point: [500, 500, 0.5],
      style: { color: 'blue' }
    }
  )
}

const Result = ({ groupedCoordinates }) => {
  return (
    <table className='absolute bottom-2 left-2 z-10 text-left border-collapse'>
      <thead>
        <tr>
          <th className="border border-slate-300">x</th>
          <th className="border border-slate-300">y</th>
        </tr>
      </thead>
      <tbody>
        {groupedCoordinates && Object.keys(groupedCoordinates).map(k =>
          groupedCoordinates[k].map((p, i) =>
            <tr key={i} style={{ color: k }}>
              <td className='border'>{p[0].toFixed(1)}</td>
              <td className='border'>{p[1].toFixed(1)}</td>
            </tr>))}
      </tbody>
    </table >
  )
}

const App = () => {
  const [groupedCoordinates, setGroupedCoordinates] = useState({});
  return (
    <div className="App">
      <Tldraw
        showMenu={false}
        showPages={false}
        showSponsorLink={false}
        onMount={(e) => {
          window.tldraw = e
          doMock && mock(e)
          if (showUsage) {
            e.createShapes({
              id: 'usage',
              type: TDShapeType.Sticky,
              point: [20, 20],
              text: usage
            }).style({ textAlign: 'start', font: 'erif' })
            setTimeout(() => e.toggleLocked(['usage']), 100)
          }
        }}
        onChange={(e) => {
          debug && console.log(e.getShapes());
          setGroupedCoordinates(analyze(e))
        }}
      />
      <Result groupedCoordinates={groupedCoordinates} />
    </div>
  );
}

export default App;
