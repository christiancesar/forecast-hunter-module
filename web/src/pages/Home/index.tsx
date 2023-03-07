import {
  Badge, Box, Button, Checkbox, Container, Select, Stack, Tab, Table, TableContainer, TabList, TabPanel, TabPanels, Tabs, Tbody, Td, Text, Tfoot, Th, Thead, Tooltip, Tr, Wrap
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FiDownload, FiSearch } from 'react-icons/fi';
import { Header } from '../Header';

type StillClassified = {
  code: string;
  description: string;
  color: string;
  quantity: number;
  weight: number;
  stock: number;
  mrp: number;
  budgets: {
    shortId: number;
    customer: string;
    quantity: number;
  }[];
};

type Customer = {
  name: string;
  shortId: number;
}

type Color = {
  name: string;
}

export const Home: React.FC = () => {
  const [still, setStill] = useState([] as StillClassified[])
  const [customers, setCustomers] = useState([] as Customer[])
  const [colors, setColors] = useState([] as Color[])

  const [filteredStill, setFilteredStill] = useState([] as StillClassified[])

  const [budgetIdFilter, setBudgetIdFilter] = useState(0)
  const [colorNameFilter, setColorNameFilter] = useState('')
  const [purchaseRequiredFilter, setPurchaseRequiredFilter] = useState(false)
  useEffect(() => {
    fetch('http://localhost:3333/mrp_still/')
      .then(response => response.json())
      .then((data: StillClassified[]) => {
        setStill(data)
        setFilteredStill(data)
      })
  }, [])

  useEffect(() => {

    const customersList = [] as Customer[]
    still.map((item) => {
      item.budgets.map((budget) => {
        const customer = customersList.filter((customer) => {
          return customer.shortId === budget.shortId
        })

        if (customer.length === 0) {
          customersList.push({
            name: budget.customer,
            shortId: budget.shortId
          })
        }
      })
    })

    setCustomers(customersList.sort((a, b) => a.shortId - b.shortId))
  }, [still])

  useEffect(() => {

    const colorList = [] as Color[]
    still.filter((item) => {
      const color = colorList.filter((color) => {
        return color.name === item.color
      })

      if (color.length === 0) {
        colorList.push({
          name: item.color,
        })
      }
    })

    setColors(colorList.sort((a, b) => a.name.localeCompare(b.name)))
  }, [still])

  const filterStill = useCallback(() => {
    console.log('colorNameFilter:', colorNameFilter)
    console.log('purchaseRequiredFilter:', purchaseRequiredFilter)

    if ((colorNameFilter !== '') && (purchaseRequiredFilter)) {
      const filtered = still.filter((item) => {
        return ((item.color === colorNameFilter) && item.mrp > 0)
      })

      setFilteredStill(filtered)
    } else if (colorNameFilter !== '') {
      const filtered = still.filter((item) => {
        return (item.color === colorNameFilter)
      })
      
      setFilteredStill(filtered)
    } else if (purchaseRequiredFilter) {
      const filtered = still.filter((item) => {
        return item.mrp > 0
      })

      setFilteredStill(filtered)
    } else {
      setFilteredStill(still)
    }
  }, [colorNameFilter, still, purchaseRequiredFilter])

  

  return (
    <Container
      maxW={1600}
    >
      <Header title='Necessidade de compra' />
      <Box>
        <Tabs isFitted variant='soft-rounded' colorScheme="teal">
          <TabList mb='1em'>
            <Tab>Perfil</Tab>
            {/* <Tab>Acessorios</Tab>
            <Tab>Vidros</Tab>
            <Tab>Kits</Tab> */}
          </TabList>

          <Stack spacing={3} direction="column" p="5" bgColor="gray.800" borderRadius={5}>
            <Text>
              Filtros
            </Text>
            <Stack direction="row">
              <Select 
                placeholder='Cor' 
                size='lg'
                onChange={(event) => setColorNameFilter(event.target.value)}
              >
                {
                  colors.map((color, index) => {
                    return (
                      <option key={`${index}-${color.name}`} value={color.name}>{color.name}</option>
                    )
                  })
                }
              </Select>
            </Stack>
            <Checkbox isChecked={purchaseRequiredFilter} onChange={() => setPurchaseRequiredFilter(!purchaseRequiredFilter)} mb="2">Apenas itens com necessidade de compras</Checkbox>
            <Stack>
              <Button
                rightIcon={< FiSearch />}
                colorScheme="teal"
                onClick={() =>filterStill()}
              >
                Filtrar
              </Button>
            </Stack>
          </Stack>

          <TabPanels>
            <TabPanel>
              <TableContainer >
                <Table variant='unstyled' size="sm">
                  <Thead bgColor='teal.300' position="sticky" top={0}>
                    <Tr>
                      <Th p={5}>Código Produto</Th>
                      <Th>Descrição</Th>
                      <Th>Cor</Th>

                      <Th isNumeric>Quantidade (BR)</Th>
                      <Th isNumeric>Estoque (BR)</Th>
                      <Th isNumeric>MRP (Comprar)</Th>

                      <Th isNumeric>Peso Total (Kg)</Th>
                      <Th>Orçamento(s)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {
                      filteredStill.map((item, index) => {
                        return (
                          <Tr
                            key={`${index}-${item.code}`}
                            _hover={{ backgroundColor: "teal.300" }}
                            transition="background-color 0.4s"
                          >
                            <Td
                              p={5}
                              borderStartRadius={5}
                            >
                              {item.code}
                            </Td>
                            <Td>{item.description}</Td>
                            <Td>{item.color}</Td>

                            <Td isNumeric>{item.quantity.toFixed(2)}</Td>
                            <Td isNumeric>{item.stock.toFixed(2)}</Td>
                            <Td isNumeric>{item.mrp.toFixed(2)}</Td>

                            <Td isNumeric>{item.weight.toFixed(2)}</Td>
                            <Td borderEndRadius={5}>
                              <Wrap >
                                {
                                  item.budgets.map((budget, index) => {
                                    return (
                                      <Tooltip key={`${index}-${budget.shortId}`} label={`${budget.customer} | ${budget.quantity}`}>
                                        <Badge mr={0.5} p={1} colorScheme='green' >{budget.shortId}</Badge>
                                      </Tooltip>
                                    )
                                  })
                                }
                              </Wrap>
                            </Td>
                          </Tr>
                        )
                      })
                    }
                  </Tbody>
                  <Tfoot>
                    <Tr>
                      <Th> Total</Th>
                      <Th />
                      <Th />

                      <Th />
                      <Th />
                      <Th isNumeric>
                        {
                          filteredStill.reduce((previous, current) => {
                            return previous + current.quantity
                          }, 0).toFixed(2)
                        }
                      </Th>

                      <Th isNumeric>
                        {
                          filteredStill.reduce((previous, current) => {
                            return previous + current.weight
                          }, 0).toFixed(2)
                        }
                      </Th>
                      <Th />
                    </Tr>
                  </Tfoot>
                </Table>
              </TableContainer>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container >
  )
}